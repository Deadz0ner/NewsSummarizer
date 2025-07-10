import React, { useState } from 'react';
import { Clock, ExternalLink, FileText } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import api from '../services/api';
import toast from 'react-hot-toast';

const NewsCard = ({ article }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLength, setSummaryLength] = useState('medium');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateSummary = async () => {
  if (!article.content || article.content === '[Removed]') {
    toast.error('Article content is not available for summarization');
    return;
  }

  setIsGenerating(true);
  try {
    const response = await api.post('/summary/generate', {
      articleUrl: article.url,
      title: article.title,
      content: article.content,
      summaryLength,
      category: 'general',
      source: article.source.name,
      publishedAt: article.publishedAt
    });

    setSummary(response.data.summary);
    
    // Show appropriate success message
    if (response.data.usedFallback) {
      toast.success('Summary generated using fallback method');
    } else {
      toast.success(`Summary generated using ${response.data.modelUsed}`);
    }
  } catch (error) {
    console.error('Error generating summary:', error);
  } finally {
    setIsGenerating(false);
  }
};


  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {article.urlToImage && (
        <img
          src={article.urlToImage}
          alt={article.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-blue-600 font-medium">
            {article.source.name}
          </span>
          <div className="flex items-center text-sm text-gray-500">
            <Clock size={14} className="mr-1" />
            {formatDate(article.publishedAt)}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
          {article.title}
        </h3>

        <p className="text-gray-600 mb-4 line-clamp-3">
          {article.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Summary length:</label>
            <select
              value={summaryLength}
              onChange={(e) => setSummaryLength(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={generateSummary}
              disabled={isGenerating || !article.content || article.content === '[Removed]'}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <LoadingSpinner size="small" />
              ) : (
                <FileText size={14} />
              )}
              <span>{isGenerating ? 'Generating...' : 'Summarize'}</span>
            </button>

            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
            >
              <ExternalLink size={14} />
              <span>Read Full</span>
            </a>
          </div>
        </div>

        {summary && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">
              AI Summary ({summaryLength})
            </h4>
            <p className="text-sm text-blue-700 leading-relaxed">
              {summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsCard;
