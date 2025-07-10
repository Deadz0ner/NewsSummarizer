import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Clock, ExternalLink, Trash2 } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const SummaryHistory = () => {
  const [page, setPage] = useState(1);

  const { data: historyData, isLoading, refetch } = useQuery(
    ['summaryHistory', page],
    async () => {
      const response = await api.get('/summary/history', {
        params: { page, limit: 10 }
      });
      return response.data;
    },
    {
      keepPreviousData: true,
    }
  );

  const deleteSummary = async (summaryId) => {
    if (!window.confirm('Are you sure you want to delete this summary?')) {
      return;
    }

    try {
      await api.delete(`/summary/${summaryId}`);
      toast.success('Summary deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting summary:', error);
    }
  };
  const getModelBadge = (summary) => {
  // This would require adding modelUsed field to your Summary schema
  // For now, we'll show a generic badge
  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
      AI Generated
    </span>
  );
};

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSummaryLengthBadge = (length) => {
    const colors = {
      short: 'bg-green-100 text-green-800',
      medium: 'bg-blue-100 text-blue-800',
      detailed: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[length]}`}>
        {length.charAt(0).toUpperCase() + length.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Summary History</h1>
        <p className="mt-2 text-gray-600">
          View and manage your previously generated article summaries
        </p>
      </div>

      {historyData?.summaries?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No summaries found. Start by summarizing some news articles!</p>
        </div>
      ) : (
        <>
          <div className="space-y-6 mb-8">
            {historyData?.summaries?.map((summary) => (
              <div key={summary._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {summary.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span>{summary.source}</span>
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {formatDate(summary.createdAt)}
                      </div>
                      {getSummaryLengthBadge(summary.summaryLength)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <a
                      href={summary.articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Read original article"
                    >
                      <ExternalLink size={16} />
                    </a>
                    <button
                      onClick={() => deleteSummary(summary._id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete summary"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">
                    AI Summary
                  </h4>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    {summary.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {historyData?.totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {page} of {historyData.totalPages}
              </span>
              
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= historyData.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SummaryHistory;
