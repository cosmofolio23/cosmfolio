/**
 * ShareModal Component
 * Phase 6: Task 6.5 - Portfolio sharing interface with social buttons, QR code, analytics
 */

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Users,
  MessageCircle,
  Mail,
  Copy,
  Check,
  Download,
  BarChart3,
  X,
} from 'lucide-react';
import QRCode from 'qrcode.react';
import './ShareModal.css';

interface ShareModalProps {
  portfolioId: string;
  portfolioTitle: string;
  onClose: () => void;
  onShare?: (platform: string) => void;
}

interface ShareStats {
  views: number;
  uniqueVisitors: number;
  topReferrer: string;
  shareCount: number;
}

interface ShareLink {
  platform: string;
  url: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  portfolioId,
  portfolioTitle,
  onClose,
  onShare,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'social' | 'download' | 'analytics'>('link');
  const [copied, setCopied] = useState(false);
  const [shareStats, setShareStats] = useState<ShareStats>({
    views: 0,
    uniqueVisitors: 0,
    topReferrer: 'Direct',
    shareCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'html' | 'zip'>('pdf');
  const [shareMessage, setShareMessage] = useState(
    `Check out my architecture portfolio: "${portfolioTitle}"`
  );

  const publicUrl = `https://cosmofolio.com/p/${portfolioId}`;

  // Fetch analytics on mount
  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/analytics?days=30`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShareStats({
          views: data.total_views || 0,
          uniqueVisitors: data.unique_visitors || 0,
          topReferrer: data.top_referrers?.[0] || 'Direct',
          shareCount: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const shareLinks: ShareLink[] = [
    {
      platform: 'linkedin',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`,
      label: 'LinkedIn',
      icon: <Users size={20} />,
      color: '#0A66C2',
    },
    {
      platform: 'twitter',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(publicUrl)}`,
      label: 'Twitter',
      icon: <MessageCircle size={20} />,
      color: '#1DA1F2',
    },
    {
      platform: 'facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`,
      label: 'Facebook',
      icon: <Share2 size={20} />,
      color: '#1877F2',
    },
    {
      platform: 'email',
      url: `mailto:?subject=${encodeURIComponent(portfolioTitle)}&body=${encodeURIComponent(`${shareMessage}\n${publicUrl}`)}`,
      label: 'Email',
      icon: <Mail size={20} />,
      color: '#EA4335',
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSocialShare = (platform: string, url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
    onShare?.(platform);
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          format: downloadFormat,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Trigger download
        const a = document.createElement('a');
        a.href = data.download_url;
        a.download = data.filename;
        a.click();
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="share-modal-header">
          <h2>Share Your Portfolio</h2>
          <button className="share-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="share-tabs">
          <button
            className={`share-tab ${activeTab === 'link' ? 'active' : ''}`}
            onClick={() => setActiveTab('link')}
          >
            Link
          </button>
          <button
            className={`share-tab ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            Social
          </button>
          <button
            className={`share-tab ${activeTab === 'download' ? 'active' : ''}`}
            onClick={() => setActiveTab('download')}
          >
            Download
          </button>
          <button
            className={`share-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </div>

        {/* Tab Content */}
        <div className="share-content">
          {/* Link Tab */}
          {activeTab === 'link' && (
            <div className="share-section">
              <h3>Share Your Link</h3>
              <p className="share-description">
                Copy and share your portfolio link with anyone
              </p>

              {/* Link Display */}
              <div className="link-container">
                <input
                  type="text"
                  value={publicUrl}
                  readOnly
                  className="link-input"
                />
                <button className="copy-button" onClick={copyToClipboard}>
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* QR Code */}
              <div className="qr-container">
                <div className="qr-code">
                  <QRCode
                    value={publicUrl}
                    size={180}
                    level="H"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
                <div className="qr-info">
                  <p>Scan this QR code to view your portfolio on mobile devices</p>
                  <button className="download-qr-button">
                    Download QR Code
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <div className="share-section">
              <h3>Share on Social Media</h3>
              <p className="share-description">
                Customize your message and share to your social networks
              </p>

              {/* Message Editor */}
              <div className="message-editor">
                <label>Share Message</label>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Enter your share message"
                  rows={3}
                  className="message-input"
                />
              </div>

              {/* Social Buttons */}
              <div className="social-buttons">
                {shareLinks.map((link) => (
                  <button
                    key={link.platform}
                    className="social-button"
                    style={{ '--button-color': link.color } as any}
                    onClick={() => handleSocialShare(link.platform, link.url)}
                    title={`Share on ${link.label}`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </button>
                ))}
              </div>

              {/* Platform Guidelines */}
              <div className="guidelines">
                <h4>Tips for Better Sharing</h4>
                <ul>
                  <li>LinkedIn: Use professional language and relevant hashtags</li>
                  <li>Twitter: Keep message concise, max 280 characters</li>
                  <li>Facebook: Include engaging description and hashtags</li>
                  <li>Email: Add a personal touch with custom message</li>
                </ul>
              </div>
            </div>
          )}

          {/* Download Tab */}
          {activeTab === 'download' && (
            <div className="share-section">
              <h3>Download Your Portfolio</h3>
              <p className="share-description">
                Export in multiple formats for different uses
              </p>

              {/* Format Selector */}
              <div className="format-selector">
                <div className="format-options">
                  <label className="format-option">
                    <input
                      type="radio"
                      name="format"
                      value="pdf"
                      checked={downloadFormat === 'pdf'}
                      onChange={(e) => setDownloadFormat(e.target.value as any)}
                    />
                    <div className="format-card">
                      <h4>PDF</h4>
                      <p>Professional PDF document</p>
                      <span className="format-size">2-5 MB</span>
                    </div>
                  </label>

                  <label className="format-option">
                    <input
                      type="radio"
                      name="format"
                      value="html"
                      checked={downloadFormat === 'html'}
                      onChange={(e) => setDownloadFormat(e.target.value as any)}
                    />
                    <div className="format-card">
                      <h4>HTML</h4>
                      <p>Interactive web version</p>
                      <span className="format-size">500 KB</span>
                    </div>
                  </label>

                  <label className="format-option">
                    <input
                      type="radio"
                      name="format"
                      value="zip"
                      checked={downloadFormat === 'zip'}
                      onChange={(e) => setDownloadFormat(e.target.value as any)}
                    />
                    <div className="format-card">
                      <h4>ZIP</h4>
                      <p>Complete package with files</p>
                      <span className="format-size">10-50 MB</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Download Button */}
              <button
                className="download-button"
                onClick={handleDownload}
                disabled={loading}
              >
                <Download size={20} />
                {loading ? 'Preparing...' : 'Download'}
              </button>

              {/* Format Info */}
              <div className="format-info">
                <h4>Format Recommendations</h4>
                <p>
                  <strong>PDF:</strong> Best for printing and sharing via email
                </p>
                <p>
                  <strong>HTML:</strong> Perfect for web viewing with full interactivity
                </p>
                <p>
                  <strong>ZIP:</strong> Complete backup with all assets and metadata
                </p>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="share-section">
              <h3>Share Analytics</h3>
              <p className="share-description">
                Track how many people view your portfolio
              </p>

              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Total Views</div>
                  <div className="stat-value">{shareStats.views}</div>
                  <div className="stat-change">Last 30 days</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Unique Visitors</div>
                  <div className="stat-value">{shareStats.uniqueVisitors}</div>
                  <div className="stat-change">Last 30 days</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Top Referrer</div>
                  <div className="stat-value">{shareStats.topReferrer}</div>
                  <div className="stat-change">Most traffic from</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Share Count</div>
                  <div className="stat-value">{shareStats.shareCount}</div>
                  <div className="stat-change">Times shared</div>
                </div>
              </div>

              {/* Referrer Sources */}
              <div className="referrer-section">
                <h4>Traffic Sources</h4>
                <div className="referrer-list">
                  <div className="referrer-item">
                    <span className="referrer-name">Direct</span>
                    <span className="referrer-count">42%</span>
                  </div>
                  <div className="referrer-item">
                    <span className="referrer-name">LinkedIn</span>
                    <span className="referrer-count">28%</span>
                  </div>
                  <div className="referrer-item">
                    <span className="referrer-name">Twitter</span>
                    <span className="referrer-count">18%</span>
                  </div>
                  <div className="referrer-item">
                    <span className="referrer-name">Email</span>
                    <span className="referrer-count">12%</span>
                  </div>
                </div>
              </div>

              {/* Refresh Button */}
              <button className="refresh-button" onClick={fetchAnalytics}>
                <BarChart3 size={16} />
                Refresh Analytics
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="share-modal-footer">
          <p>Your portfolio is now public and can be shared with anyone</p>
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
