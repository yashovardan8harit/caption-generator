"use client";
import React, { useState } from "react";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from "./../components/ui/sidebar";

import { Home, LogOut, Settings, User, Copy, Download, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { BackgroundBeamsWithCollision } from "./../components/ui/background";
import { FileUpload } from "../components/ui/file-upload";
import { motion, AnimatePresence } from "framer-motion";

// Import the required functions
import { uploadToCloudinary } from "../lib/utils";
import axios from "axios";

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5 shrink-0 text-neutral-200" />,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: <User className="h-5 w-5 shrink-0 text-neutral-200" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5 shrink-0 text-neutral-200" />,
    },
  ];

  // Enhanced state variables
  const [captionGenerated, setCaptionGenerated] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  // Clear error after 5 seconds
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle file upload with better error handling and progress
  const handleFileUpload = async (files) => {
    try {
      const file = files[0];
      if (!file) return;

      setError(null);
      setUploadLoading(true);
      setUploadProgress(0);
      setCaptionGenerated(false);
      setCaptionText('');

      // Upload with progress callback
      const imageUrl = await uploadToCloudinary(file, (progress) => {
        setUploadProgress(progress);
      });

      console.log("Uploaded to Cloudinary:", imageUrl);
      setImageUrl(imageUrl);
      setUploadedFile(file);
      setUploadProgress(100);
      
      // Small delay to show 100% progress
      setTimeout(() => {
        setUploadLoading(false);
        setUploadProgress(0);
      }, 500);

    } catch (error) {
      console.error("Upload error:", error);
      setError(`Upload failed: ${error.message}`);
      setUploadLoading(false);
      setUploadProgress(0);
      setImageUrl(null);
      setUploadedFile(null);
    }
  };

  // Handle caption generation with better error handling
  const handleGenerateCaption = async () => {
    if (!imageUrl) {
      setError("Please upload an image first.");
      return;
    }
    
    setLoading(true);
    setCaptionGenerated(false);
    setError(null);
    
    try {
      const res = await axios.post("http://localhost:8000/generate-caption", {
        image_url: imageUrl,
      });
      
      if (res.data.success) {
        setCaptionText(res.data.caption);
        setCaptionGenerated(true);
      } else {
        throw new Error("Caption generation failed");
      }
    } catch (err) {
      console.error("Error fetching caption:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Failed to generate caption";
      setError(`Caption generation failed: ${errorMessage}`);
      setCaptionText("");
      setCaptionGenerated(false);
    }
    
    setLoading(false);
  };

  // Copy caption to clipboard
  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(captionText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError("Failed to copy caption to clipboard");
    }
  };

  // Reset all states
  const handleReset = () => {
    setImageUrl(null);
    setUploadedFile(null);
    setCaptionGenerated(false);
    setCaptionText('');
    setError(null);
    setUploadProgress(0);
  };

  // Download image
  const handleDownloadImage = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = uploadedFile?.name || 'downloaded-image';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar - Fixed positioning */}
      <div className="fixed left-0 top-0 h-full z-20">
        <Sidebar 
          className="h-full border-r border-neutral-800 bg-neutral-900"
          open={sidebarOpen}
          setOpen={setSidebarOpen}
        >
          <SidebarBody className="flex flex-col justify-between h-full px-4 py-6">
            <div className="space-y-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>

            {/* Bottom profile section */}
            <div className="pt-6 border-t border-neutral-700">
              <SidebarLink
                link={{
                  label: "Logout",
                  href: "/logout",
                  icon: <LogOut className="h-5 w-5 shrink-0 text-neutral-200" />,
                }}
              />
            </div>
          </SidebarBody>
        </Sidebar>
      </div>

      {/* Main content with dynamic margin for sidebar */}
      <motion.main 
        className="flex-1 relative bg-black text-white overflow-y-auto h-screen"
        animate={{
          marginLeft: sidebarOpen ? "300px" : "60px"
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
      >
        {/* Fixed background */}
        <div className="fixed inset-0 z-0" style={{ marginLeft: sidebarOpen ? "-300px" : "-60px" }}>
          <BackgroundBeamsWithCollision />
        </div>
        
        {/* Scrollable content */}
        <div className="relative z-10 w-full px-4 flex flex-col items-center justify-start gap-8 py-10 min-h-screen">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text mb-4">
              AI Caption Generator
            </h1>
            <p className="text-neutral-400 text-lg max-w-2xl">
              Upload your image and let AI create perfect captions for your social media posts
            </p>
          </motion.div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-2xl bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center gap-3"
              >
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* File Upload Section */}
          <div className="w-full max-w-3xl p-1 rounded-xl border-2 border-blue-400 shadow-[0_0_15px_3px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_5px_rgba(59,130,246,0.6)] transition duration-300 ease-in-out">
            <FileUpload onChange={handleFileUpload} />
          </div>

          {/* Upload Progress */}
          <AnimatePresence>
            {uploadLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-md"
              >
                <div className="bg-neutral-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-300">Uploading...</span>
                    <span className="text-sm text-blue-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-neutral-700 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Uploaded Image Preview */}
          <AnimatePresence>
            {imageUrl && !uploadLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md relative group"
              >
                <img 
                  src={imageUrl} 
                  alt="Uploaded" 
                  className="w-full h-auto rounded-lg shadow-lg border border-neutral-700"
                />
                {/* Image Actions */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={handleDownloadImage}
                    className="p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
                    title="Download Image"
                  >
                    <Download className="h-4 w-4 text-white" />
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
                    title="Remove Image"
                  >
                    <RefreshCw className="h-4 w-4 text-white" />
                  </button>
                </div>
                
                {/* File Info */}
                <div className="mt-2 text-xs text-neutral-400 text-center">
                  {uploadedFile?.name} • {uploadedFile && (uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Caption Button */}
          <motion.button
            className="p-[3px] relative disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGenerateCaption}
            disabled={!imageUrl || loading || uploadLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
            <div className="px-8 py-3 bg-black rounded-[6px] relative group transition duration-200 text-white hover:bg-transparent flex items-center gap-2">
              {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
              {loading ? "Generating Caption..." : "Generate AI Caption"}
            </div>
          </motion.button>

          {/* Generated Caption */}
          <AnimatePresence>
            {captionGenerated && captionText && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/50 p-6 rounded-xl text-white max-w-2xl w-full shadow-2xl backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    Generated Caption
                  </h2>
                  <button
                    onClick={handleCopyCaption}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-colors text-sm"
                    title="Copy to Clipboard"
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                
                <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20">
                  <p className="text-purple-100 leading-relaxed text-lg">
                    {captionText}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleGenerateCaption}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Generate New
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Section */}
          <div className="space-y-6 text-center max-w-2xl w-full">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-neutral-800/50 backdrop-blur-sm p-6 rounded-lg border border-neutral-700">
                <h4 className="text-lg font-medium mb-3 text-purple-400">✨ Features</h4>
                <ul className="text-sm text-neutral-300 space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    AI-powered caption generation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    Secure cloud image storage
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    One-click copy to clipboard
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    Beautiful animated interface
                  </li>
                </ul>
              </div>
              
              <div className="bg-neutral-800/50 backdrop-blur-sm p-6 rounded-lg border border-neutral-700">
                <h4 className="text-lg font-medium mb-3 text-blue-400">🚀 How it works</h4>
                <div className="text-sm text-neutral-300 space-y-2 text-left">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-medium">1.</span>
                    <span>Upload your image</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-medium">2.</span>
                    <span>Click "Generate AI Caption"</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-medium">3.</span>
                    <span>Copy and use your caption</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-sm text-gray-500 py-4 mt-8 border-t border-neutral-800">
            <p>© 2025 AI Caption Generator • Built with ❤️ for creators</p>
            <p className="text-xs mt-1 text-gray-600">
              Powered by AI • Secure • Fast • Free
            </p>
          </footer>
        </div>
      </motion.main>
    </div>
  );
};

export default AppLayout;