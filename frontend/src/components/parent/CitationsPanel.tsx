import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';

interface Citation {
  id: number;
  source_type: string;
  source_title: string;
  source_url: string;
  source_date?: string;
  relevant_excerpt?: string;
  page_section?: string;
  timestamp: string;
  confidence_score: number;
  is_public_domain: boolean;
  license_type: string;
}

interface CitationSummary {
  source_type: string;
  source_title: string;
  source_url: string;
  usage_count: number;
  last_used: string;
}

interface CitationsPanelProps {
  sessionId?: string;  // Optional - if provided, show only this session
  childId: string;      // Required - show all citations for this child
}

const CitationsPanel: React.FC<CitationsPanelProps> = ({ sessionId, childId }) => {
  const { parentTheme } = useTheme();
  const isLight = parentTheme === 'light';

  const [summaries, setSummaries] = useState<CitationSummary[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'summary' | 'detailed'>('summary');
  const [expandedCitation, setExpandedCitation] = useState<number | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const fetchCitations = useCallback(async () => {
    try {
      setLoading(true);

      // Use child_id to get all citations across all sessions for this child
      if (view === 'summary') {
        const response = await axios.get(
          `${API_URL}/api/citations/child/${childId}/summary`
        );
        setSummaries(response.data);
      } else {
        const response = await axios.get(
          `${API_URL}/api/citations/child/${childId}`
        );
        setCitations(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch citations:', error);
    } finally {
      setLoading(false);
    }
  }, [childId, view, API_URL]);

  useEffect(() => {
    fetchCitations();
  }, [fetchCitations]);

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'cdc':
        return '🏥';
      case 'cpsc':
        return '🛡️';
      case 'nih':
        return '🔬';
      default:
        return '📚';
    }
  };

  const getSourceColor = (sourceType: string) => {
    if (isLight) {
      switch (sourceType) {
        case 'cdc':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'cpsc':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'nih':
          return 'bg-purple-100 text-purple-800 border-purple-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    } else {
      // Dark mode colors
      switch (sourceType) {
        case 'cdc':
          return 'bg-blue-900/30 text-blue-300 border-blue-500/30';
        case 'cpsc':
          return 'bg-green-900/30 text-green-300 border-green-500/30';
        case 'nih':
          return 'bg-purple-900/30 text-purple-300 border-purple-500/30';
        default:
          return 'bg-dark-100 text-gray-300 border-white/10';
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isLight ? 'border-blue-500' : 'border-cyan-500'} mx-auto`}></div>
          <p className={`mt-4 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Loading citations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isLight ? 'bg-white' : 'bg-dark-100 border border-white/10'} rounded-lg shadow-md p-6`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>Sources & Citations</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView('summary')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'summary'
                ? (isLight ? 'bg-blue-500 text-white' : 'bg-cyan-600 text-white')
                : (isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-dark-200 text-gray-300 hover:bg-dark-300')
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setView('detailed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'detailed'
                ? (isLight ? 'bg-blue-500 text-white' : 'bg-cyan-600 text-white')
                : (isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-dark-200 text-gray-300 hover:bg-dark-300')
            }`}
          >
            Detailed
          </button>
        </div>
      </div>

      <div className={`mb-4 p-4 ${isLight ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-blue-900/20 border-blue-500/30 text-blue-300'} border rounded-lg`}>
        <p className="text-sm">
          <strong>Note:</strong> All information sources are from public domain U.S. government
          materials (CDC, CPSC, NIH). These sources are freely available and legal to use.
        </p>
      </div>

      {view === 'summary' ? (
        // Summary View
        <div className="space-y-4">
          {summaries.length === 0 ? (
            <div className={`text-center ${isLight ? 'text-gray-500' : 'text-gray-400'} py-12`}>
              <div className={`w-20 h-20 ${isLight ? 'bg-blue-100 border-blue-300' : 'bg-blue-500/20 border-blue-500/30'} rounded-full flex items-center justify-center mx-auto mb-6 border`}>
                <svg className={`w-10 h-10 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="font-semibold mb-2">No sources yet</p>
              <p className="text-sm">
                When the AI uses trusted information from CDC, CPSC, or NIH to answer questions,
                sources will appear here.
              </p>
            </div>
          ) : (
            summaries.map((summary, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getSourceColor(summary.source_type)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{getSourceIcon(summary.source_type)}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{summary.source_title}</h3>
                    <a
                      href={summary.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline break-all"
                    >
                      {summary.source_url}
                    </a>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="font-medium">
                        Used {summary.usage_count} time{summary.usage_count !== 1 ? 's' : ''}
                      </span>
                      <span className="opacity-70">
                        Last used: {formatDate(summary.last_used)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // Detailed View
        <div className="space-y-3">
          {citations.length === 0 ? (
            <div className={`text-center ${isLight ? 'text-gray-500' : 'text-gray-400'} py-12`}>
              <div className={`w-20 h-20 ${isLight ? 'bg-blue-100 border-blue-300' : 'bg-blue-500/20 border-blue-500/30'} rounded-full flex items-center justify-center mx-auto mb-6 border`}>
                <svg className={`w-10 h-10 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="font-semibold mb-2">No citations yet</p>
              <p className="text-sm">
                When the AI uses trusted information from CDC, CPSC, or NIH to answer questions,
                detailed citations will appear here.
              </p>
            </div>
          ) : (
            citations.map((citation) => (
              <div key={citation.id} className={`border ${isLight ? 'border-gray-200' : 'border-white/10'} rounded-lg`}>
                <button
                  onClick={() =>
                    setExpandedCitation(expandedCitation === citation.id ? null : citation.id)
                  }
                  className={`w-full p-4 text-left ${isLight ? 'hover:bg-gray-50' : 'hover:bg-white/5'} transition-colors rounded-lg`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getSourceIcon(citation.source_type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>{citation.source_title}</h4>
                        <span className={`text-xs px-2 py-1 ${isLight ? 'bg-green-100 text-green-800' : 'bg-green-900/40 text-green-300'} rounded`}>
                          Public Domain
                        </span>
                      </div>
                      <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{formatDate(citation.timestamp)}</p>
                      {citation.page_section && (
                        <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                          Section: {citation.page_section}
                        </p>
                      )}
                    </div>
                    <svg
                      className={`w-5 h-5 ${isLight ? 'text-gray-400' : 'text-gray-500'} transition-transform ${
                        expandedCitation === citation.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {expandedCitation === citation.id && (
                  <div className={`px-4 pb-4 border-t ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                    <div className="pt-4 space-y-3">
                      <div>
                        <p className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-gray-300'} mb-1`}>Source URL:</p>
                        <a
                          href={citation.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-sm ${isLight ? 'text-blue-600' : 'text-cyan-400'} hover:underline break-all`}
                        >
                          {citation.source_url}
                        </a>
                      </div>

                      {citation.relevant_excerpt && (
                        <div>
                          <p className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-gray-300'} mb-1`}>
                            Relevant Content:
                          </p>
                          <p className={`text-sm ${isLight ? 'text-gray-600 bg-gray-50 border-gray-200' : 'text-gray-300 bg-white/5 border-white/10'} p-3 rounded border`}>
                            {citation.relevant_excerpt}
                          </p>
                        </div>
                      )}

                      <div className={`flex gap-4 text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        <span>License: {citation.license_type.replace('_', ' ')}</span>
                        <span>Relevance: {citation.confidence_score}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Legal Disclaimer */}
      <div className={`mt-6 p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-dark-200 border-white/10'} border rounded-lg`}>
        <h4 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-2`}>About Our Sources</h4>
        <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'} mb-2`}>
          All information is sourced from public domain materials provided by U.S. federal
          government agencies:
        </p>
        <ul className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'} space-y-1 ml-4`}>
          <li>
            <strong>CDC (Centers for Disease Control and Prevention):</strong> Child health and
            safety guidelines
          </li>
          <li>
            <strong>CPSC (Consumer Product Safety Commission):</strong> Product safety information
          </li>
          <li>
            <strong>NIH (National Institutes of Health):</strong> Children's health research
          </li>
        </ul>
        <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-500'} mt-3`}>
          Under U.S. law (17 USC § 105), works created by federal government employees are not
          subject to copyright protection and are in the public domain.
        </p>
      </div>
    </div>
  );
};

export default CitationsPanel;
