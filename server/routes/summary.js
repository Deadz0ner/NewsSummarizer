const express = require('express');
const { HfInference } = require('@huggingface/inference');
const Summary = require('../models/Summary');
const auth = require('../middleware/auth');

const router = express.Router();

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Fallback extractive summarization (same as before)
const extractiveSummary = (text, sentences = 3) => {
  const sentenceArray = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  const wordFreq = {};
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  words.forEach(word => {
    if (word.length > 3) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  const scoredSentences = sentenceArray.map((sentence, index) => {
    const sentenceWords = sentence.toLowerCase().match(/\b\w+\b/g) || [];
    const score = sentenceWords.reduce((sum, word) => {
      return sum + (wordFreq[word] || 0);
    }, 0) / sentenceWords.length;
    
    const positionBoost = index < 3 ? 1.5 : 1;
    return { sentence: sentence.trim(), score: score * positionBoost, index };
  });

  return scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, sentences)
    .sort((a, b) => a.index - b.index)
    .map(item => item.sentence)
    .join('. ') + '.';
};

// Content preprocessing for optimal summarization
const preprocessContent = (content, maxLength = 1024) => {
  // Clean and normalize text
  let cleaned = content
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?;:()-]/g, '')
    .trim();
  
  // Hugging Face models work better with shorter inputs
  if (cleaned.length > maxLength) {
    const truncated = cleaned.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');
    if (lastSentence > maxLength * 0.7) {
      cleaned = truncated.substring(0, lastSentence + 1);
    } else {
      cleaned = truncated + '...';
    }
  }
  
  return cleaned;
};

// Determine summary length based on input
const getSummaryParams = (summaryLength, inputLength) => {
  const baseParams = {
    short: { min_length: 20, max_length: 50 },
    medium: { min_length: 40, max_length: 100 },
    detailed: { min_length: 80, max_length: 150 }
  };
  
  const params = baseParams[summaryLength];
  
  // Adjust based on input length
  const inputRatio = Math.min(inputLength / 1000, 1);
  params.max_length = Math.floor(params.max_length * (0.5 + inputRatio * 0.5));
  params.min_length = Math.min(params.min_length, params.max_length - 10);
  
  return params;
};

// Generate summary using Hugging Face
router.post('/generate', auth, async (req, res) => {
  try {
    const { 
      articleUrl, 
      title, 
      content, 
      summaryLength = 'medium',
      category,
      source,
      publishedAt
    } = req.body;

    if (!content || !title) {
      return res.status(400).json({ 
        message: 'Article content and title are required' 
      });
    }

    // Preprocess content
    const processedContent = preprocessContent(content);
    const fullText = `${title}\n\n${processedContent}`;
    
    let summary;
    let usedFallback = false;
    let modelUsed = '';

    try {
      // Get summary parameters
      const summaryParams = getSummaryParams(summaryLength, processedContent.length);
      
      // Try multiple models in order of preference
      const models = [
        'facebook/bart-large-cnn',           // Best for news summarization
        'microsoft/DialoGPT-medium',         // Good general purpose
        'sshleifer/distilbart-cnn-12-6',    // Faster, lighter version
        'google/pegasus-xsum'                // Good for extractive summaries
      ];

      let lastError;
      
      for (const model of models) {
        try {
          console.log(`Trying model: ${model}`);
          
          const result = await hf.summarization({
            model: model,
            inputs: fullText,
            parameters: {
              min_length: summaryParams.min_length,
              max_length: summaryParams.max_length,
              do_sample: false,
              temperature: 0.7,
              top_p: 0.9
            }
          });

          if (result && result.summary_text) {
            summary = result.summary_text.trim();
            modelUsed = model;
            console.log(`Successfully used model: ${model}`);
            break;
          }
          
        } catch (modelError) {
          console.log(`Model ${model} failed:`, modelError.message);
          lastError = modelError;
          continue;
        }
      }

      // If all models failed, use fallback
      if (!summary) {
        throw lastError || new Error('All Hugging Face models failed');
      }
      
    } catch (hfError) {
      console.log('Hugging Face API failed, using extractive summarization:', hfError.message);
      
      // Use extractive summarization as fallback
      const sentenceCount = summaryLength === 'short' ? 2 : summaryLength === 'medium' ? 3 : 5;
      summary = extractiveSummary(processedContent, sentenceCount);
      usedFallback = true;
      modelUsed = 'extractive-fallback';
    }

    // Ensure summary is not empty
    if (!summary || summary.trim().length === 0) {
      const sentenceCount = summaryLength === 'short' ? 2 : summaryLength === 'medium' ? 3 : 5;
      summary = extractiveSummary(processedContent, sentenceCount);
      usedFallback = true;
      modelUsed = 'extractive-fallback';
    }

    // Save summary to database
    const newSummary = new Summary({
      userId: req.user._id,
      articleUrl,
      title,
      originalContent: content,
      summary,
      category,
      source,
      publishedAt,
      summaryLength
    });

    await newSummary.save();

    res.json({
      summary,
      summaryId: newSummary._id,
      summaryLength,
      usedFallback,
      modelUsed,
      message: usedFallback 
        ? 'Generated using fallback method' 
        : `Generated using Hugging Face model: ${modelUsed}`
    });

  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate summary',
      error: error.message
    });
  }
});

// Rate limiting for API requests
const summaryRequestTracker = new Map();

router.use('/generate', (req, res, next) => {
  const userId = req.user._id.toString();
  const now = Date.now();
  const userRequests = summaryRequestTracker.get(userId) || [];
  
  // Remove requests older than 1 hour
  const recentRequests = userRequests.filter(time => now - time < 3600000);
  
  // More generous limit since it's free
  if (recentRequests.length >= 20) {
    return res.status(429).json({
      message: 'Too many summary requests. Please try again later.',
      retryAfter: 3600
    });
  }
  
  recentRequests.push(now);
  summaryRequestTracker.set(userId, recentRequests);
  next();
});

// Get user's saved summaries
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const summaries = await Summary.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-originalContent');

    const total = await Summary.countDocuments({ userId: req.user._id });

    res.json({
      summaries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific summary
router.get('/:id', auth, async (req, res) => {
  try {
    const summary = await Summary.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!summary) {
      return res.status(404).json({ message: 'Summary not found' });
    }

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete summary
router.delete('/:id', auth, async (req, res) => {
  try {
    const summary = await Summary.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!summary) {
      return res.status(404).json({ message: 'Summary not found' });
    }

    res.json({ message: 'Summary deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
