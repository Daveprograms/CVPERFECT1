'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Building, MapPin, Users, TrendingUp, Eye, CheckCircle, AlertCircle, Clock, Search, Plus, X } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/animated-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { demoWatchlist, DemoCompany } from '@/services/mocks/demoData';

interface WatchlistDemoProps {
  onCompanyUpdated?: (company: DemoCompany) => void;
}

interface SearchResult {
  id: number;
  name: string;
  industry: string;
  location: string;
  size: string;
  current_openings: number;
  match_score: number;
  description: string;
}

const searchResults: SearchResult[] = [
  {
    id: 101,
    name: "Microsoft",
    industry: "Technology",
    location: "Redmond, WA",
    size: "200,000+ employees",
    current_openings: 67,
    match_score: 94,
    description: "Leading software company with focus on cloud computing and AI."
  },
  {
    id: 102,
    name: "Apple",
    industry: "Technology",
    location: "Cupertino, CA",
    size: "150,000+ employees",
    current_openings: 34,
    match_score: 91,
    description: "Innovative technology company creating consumer electronics and software."
  },
  {
    id: 103,
    name: "Amazon",
    industry: "E-commerce",
    location: "Seattle, WA",
    size: "1,500,000+ employees",
    current_openings: 89,
    match_score: 87,
    description: "Global e-commerce and cloud computing giant."
  },
  {
    id: 104,
    name: "Meta",
    industry: "Technology",
    location: "Menlo Park, CA",
    size: "80,000+ employees",
    current_openings: 45,
    match_score: 89,
    description: "Social media and virtual reality technology company."
  },
  {
    id: 105,
    name: "Uber",
    industry: "Transportation",
    location: "San Francisco, CA",
    size: "30,000+ employees",
    current_openings: 23,
    match_score: 76,
    description: "Ride-sharing and food delivery platform."
  }
];

export const WatchlistDemo: React.FC<WatchlistDemoProps> = ({ onCompanyUpdated }) => {
  const [companies, setCompanies] = useState<DemoCompany[]>(demoWatchlist);
  const [selectedCompany, setSelectedCompany] = useState<DemoCompany | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const handleStatusChange = (companyId: number, newStatus: DemoCompany['status']) => {
    setCompanies(prev => prev.map(company => 
      company.id === companyId ? { ...company, status: newStatus } : company
    ));
    
    const updatedCompany = companies.find(c => c.id === companyId);
    if (updatedCompany && onCompanyUpdated) {
      onCompanyUpdated({ ...updatedCompany, status: newStatus });
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      // Simulate search results
      const filtered = searchResults.filter(company => 
        company.name.toLowerCase().includes(query.toLowerCase()) ||
        company.industry.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddToWatchlist = (searchResult: SearchResult) => {
    const newCompany: DemoCompany = {
      id: searchResult.id,
      name: searchResult.name,
      industry: searchResult.industry,
      location: searchResult.location,
      size: searchResult.size,
      current_openings: searchResult.current_openings,
      status: 'watching',
      match_score: searchResult.match_score,
      last_updated: new Date().toISOString(),
      description: searchResult.description,
      benefits: ["Competitive salary", "Great benefits", "Remote work", "Career growth"]
    };
    
    setCompanies(prev => [...prev, newCompany]);
    setShowSearch(false);
    setSearchQuery('');
  };

  const handleRemoveFromWatchlist = (companyId: number) => {
    setCompanies(prev => prev.filter(company => company.id !== companyId));
  };

  const getStatusColor = (status: DemoCompany['status']) => {
    switch (status) {
      case 'watching': return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'applied': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'interviewing': return 'text-purple-600 bg-purple-100 border-purple-300';
      case 'offer': return 'text-green-600 bg-green-100 border-green-300';
    }
  };

  const getStatusIcon = (status: DemoCompany['status']) => {
    switch (status) {
      case 'watching': return <Eye className="w-4 h-4" />;
      case 'applied': return <CheckCircle className="w-4 h-4" />;
      case 'interviewing': return <Clock className="w-4 h-4" />;
      case 'offer': return <TrendingUp className="w-4 h-4" />;
    }
  };

  const watchingCount = companies.filter(c => c.status === 'watching').length;
  const appliedCount = companies.filter(c => c.status === 'applied').length;
  const interviewingCount = companies.filter(c => c.status === 'interviewing').length;

  return (
    <div className="space-y-6">
      {/* Demo Mode Notice */}
      <AnimatedCard variant="glass" className="border-2 border-blue-300 bg-blue-50">
        <div className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-semibold text-blue-800">
            ✅ Demo Mode: Interactive company watchlist with dummy data.
          </span>
        </div>
      </AnimatedCard>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AnimatedCard variant="glass" className="text-center border-2 border-gray-300">
          <div className="text-2xl font-bold text-blue-600">{companies.length}</div>
          <div className="text-sm text-gray-600">Total Companies</div>
        </AnimatedCard>
        <AnimatedCard variant="glass" className="text-center border-2 border-gray-300">
          <div className="text-2xl font-bold text-blue-600">{watchingCount}</div>
          <div className="text-sm text-gray-600">Watching</div>
        </AnimatedCard>
        <AnimatedCard variant="glass" className="text-center border-2 border-gray-300">
          <div className="text-2xl font-bold text-yellow-600">{appliedCount}</div>
          <div className="text-sm text-gray-600">Applied</div>
        </AnimatedCard>
        <AnimatedCard variant="glass" className="text-center border-2 border-gray-300">
          <div className="text-2xl font-bold text-purple-600">{interviewingCount}</div>
          <div className="text-sm text-gray-600">Interviewing</div>
        </AnimatedCard>
      </div>

      {/* Add Company Section */}
      <AnimatedCard variant="glass" className="border-2 border-gray-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Building className="w-5 h-5 text-blue-600 mr-2" />
            Watchlist
          </h3>
          <FuturisticButton onClick={() => setShowSearch(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Company
          </FuturisticButton>
        </div>

        {/* Search Modal */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowSearch(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Search Companies</h3>
                  <button
                    onClick={() => setShowSearch(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search companies (e.g., Microsoft, Apple, Amazon)..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {searchResults.map((company) => (
                    <div key={company.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{company.name}</h4>
                        <p className="text-sm text-gray-600">{company.industry} • {company.location}</p>
                        <p className="text-xs text-gray-500">{company.current_openings} openings</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-blue-600">{company.match_score}% match</span>
                        <FuturisticButton size="sm" onClick={() => handleAddToWatchlist(company)}>
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </FuturisticButton>
                      </div>
                    </div>
                  ))}
                  
                  {searchQuery.length > 2 && searchResults.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No companies found for "{searchQuery}"</p>
                      <p className="text-sm">Try searching for: Microsoft, Apple, Amazon, Meta, Uber</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                selectedCompany?.id === company.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 bg-white hover:border-blue-300'
              }`}
              onClick={() => {
                setSelectedCompany(company);
                setShowDetails(true);
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{company.name}</h4>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{company.match_score}%</span>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Building className="w-4 h-4" />
                  <span>{company.industry}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{company.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{company.size}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>{company.current_openings} openings</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(company.status)}`}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(company.status)}
                    <span>{company.status}</span>
                  </div>
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFromWatchlist(company.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatedCard>

      {/* Company Details Modal */}
      <AnimatePresence>
        {showDetails && selectedCompany && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{selectedCompany.name}</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Industry</label>
                    <p className="text-gray-900">{selectedCompany.industry}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <p className="text-gray-900">{selectedCompany.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Company Size</label>
                    <p className="text-gray-900">{selectedCompany.size}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Open Positions</label>
                    <p className="text-gray-900">{selectedCompany.current_openings}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-gray-900 mt-1">{selectedCompany.description}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Benefits</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedCompany.benefits.map((benefit, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Match Score</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${selectedCompany.match_score}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{selectedCompany.match_score}%</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Application Status</label>
                  <div className="flex space-x-2 mt-2">
                    {(['watching', 'applied', 'interviewing', 'offer'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedCompany.id, status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          selectedCompany.status === status
                            ? getStatusColor(status)
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <FuturisticButton variant="outline" onClick={() => setShowDetails(false)}>
                    Close
                  </FuturisticButton>
                  <FuturisticButton>
                    View Jobs
                  </FuturisticButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 