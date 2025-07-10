const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');

const router = express.Router();

// Get news articles
router.get('/', auth, async (req, res) => {
  try {
    const { 
      category = 'general', 
      country = 'us', 
      page = 1, 
      pageSize = 20,
      q 
    } = req.query;

    let url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&page=${page}&pageSize=${pageSize}&apiKey=${process.env.NEWS_API_KEY}`;
    
    if (q) {
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}&sortBy=publishedAt&apiKey=${process.env.NEWS_API_KEY}`;
    }

    const response = await axios.get(url);
    
    res.json({
      articles: response.data.articles,
      totalResults: response.data.totalResults,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (error) {
    console.error('News API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Failed to fetch news articles',
      error: error.response?.data?.message || error.message
    });
  }
});

// Get news categories
router.get('/categories', auth, (req, res) => {
  const categories = [
    'general',
    'business',
    'entertainment',
    'health',
    'science',
    'sports',
    'technology'
  ];
  
  res.json({ categories });
});

module.exports = router;
