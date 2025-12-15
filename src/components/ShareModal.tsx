'use client';

import Image from 'next/image';
import { X, Check, Copy, Facebook, Instagram } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  spotName: string;
  spotImage: string;
  spotUrl: string;
}

export default function ShareModal({ isOpen, onClose, spotName, spotImage, spotUrl }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(spotUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(spotUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleShareInstagram = () => {
    toast.success('Link copied! Paste in your Instagram caption or DM');
    handleCopyLink();
    // Instagram doesn't have a direct share URL like Facebook, so we just copy the link
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-black/90 backdrop-blur-sm rounded-lg shadow-2xl max-w-4xl w-full border-2 border-green-500/50 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-green-500/30">
          <h2 className="text-2xl font-bold text-white font-poppins">Share {spotName}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Horizontal Content Layout */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Side - Preview Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-400 font-poppins">Preview</h3>
            <div className="bg-gray-800/50 rounded-lg overflow-hidden border-2 border-green-500/30 hover:border-green-500/50 transition-colors duration-300">
              {/* Image Preview */}
              <div className="relative h-64 w-full bg-gray-700">
                {spotImage ? (
                  <Image
                    src={spotImage}
                    alt={spotName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image available
                  </div>
                )}
              </div>

              {/* Preview Text */}
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-white text-lg line-clamp-2 font-poppins">{spotName}</h3>
                <p className="text-gray-300 text-sm line-clamp-2">Check out this amazing tourist spot in Kapangan!</p>
                <p className="text-green-400 text-xs break-all font-mono bg-black/30 p-2 rounded">{spotUrl}</p>
              </div>
            </div>
          </div>

          {/* Right Side - Share Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-400 font-poppins">Share via</h3>
            <div className="space-y-3">
              {/* Facebook */}
              <button
                onClick={handleShareFacebook}
                className="w-full flex items-center gap-3 px-5 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 font-medium hover:scale-105 shadow-lg hover:shadow-blue-500/50 border border-blue-500"
              >
                <Facebook className="w-6 h-6" />
                <span className="font-poppins text-lg">Share on Facebook</span>
              </button>

              {/* Instagram */}
              <button
                onClick={handleShareInstagram}
                className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white rounded-lg transition-all duration-300 font-medium hover:scale-105 shadow-lg hover:shadow-pink-500/50 border border-pink-500"
              >
                <Instagram className="w-6 h-6" />
                <span className="font-poppins text-lg">Share on Instagram</span>
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-lg transition-all duration-300 font-medium hover:scale-105 shadow-lg ${
                  copied
                    ? 'bg-green-600 hover:bg-green-700 text-white border-2 border-green-400 shadow-green-500/50'
                    : 'bg-gray-700 hover:bg-gray-600 text-white border-2 border-gray-500 hover:border-green-500/50'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-6 h-6" />
                    <span className="font-poppins text-lg">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-6 h-6" />
                    <span className="font-poppins text-lg">Copy Link</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Info text */}
            <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
              <p className="text-green-300 text-sm font-poppins">
                💡 Share this spot with your friends and help promote Kapangan tourism!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-green-500/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-300 font-medium font-poppins border border-gray-500 hover:border-green-500/50 hover:scale-105"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
