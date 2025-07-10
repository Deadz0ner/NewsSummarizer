import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Newspaper, History, TrendingUp, Clock } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <Newspaper className="h-8 w-8 text-blue-600" />,
      title: 'Browse News',
      description: 'Discover latest news articles from various sources and categories',
      link: '/news',
      linkText: 'Browse News'
    },
    {
      icon: <History className="h-8 w-8 text-green-600" />,
      title: 'Summary History',
      description: 'View all your previously generated article summaries',
      link: '/history',
      linkText: 'View History'
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-purple-600" />,
      title: 'AI-Powered Summaries',
      description: 'Get concise, accurate summaries using advanced AI technology',
      link: '/news',
      linkText: 'Try Now'
    },
    {
      icon: <Clock className="h-8 w-8 text-orange-600" />,
      title: 'Real-time Updates',
      description: 'Stay updated with the latest news as it happens',
      link: '/news',
      linkText: 'Get Updates'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.username}!
        </h1>
        <p className="mt-2 text-gray-600">
          Stay informed with AI-powered news summaries
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {features.map((feature, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              {feature.icon}
              <h3 className="ml-3 text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              {feature.description}
            </p>
            <Link
              to={feature.link}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {feature.linkText}
            </Link>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-semibold">1</span>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Browse News</h3>
            <p className="text-sm text-gray-600">
              Select from various news categories and sources
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 font-semibold">2</span>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Generate Summary</h3>
            <p className="text-sm text-gray-600">
              Click summarize to get AI-powered concise summaries
            </p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-600 font-semibold">3</span>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Save & Review</h3>
            <p className="text-sm text-gray-600">
              Access your summaries anytime from your history
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
