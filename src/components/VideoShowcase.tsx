import React, { useRef, useState } from "react";

const DEFAULT_VIDEO = "/VID-20260409-WA0007.mp4";

export default function VideoShowcase() {
  const [videoSrc, setVideoSrc] = useState(DEFAULT_VIDEO);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [_shareUrl, setShareUrl] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoLoaded(false);
      setShareUrl("");
    }
  };

  const handleLoadedData = () => {
    setVideoLoaded(true);
    videoRef.current?.play();
  };

  // Social sharing
  const handleShare = async (platform: string) => {
    const url = window.location.href;
    let shareLink = "";
    if (platform === "whatsapp") {
      shareLink = `https://wa.me/?text=${encodeURIComponent(
        "Watch this inspiring health movement video! " + url
      )}`;
    } else if (platform === "facebook") {
      shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    } else if (platform === "twitter") {
      shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        "Watch this inspiring health movement video! " + url
      )}`;
    }
    window.open(shareLink, "_blank");
    setShareUrl(shareLink);
  };

  // Try autoplay on first click
  React.useEffect(() => {
    const playOnClick = () => {
      if (videoLoaded) videoRef.current?.play();
    };
    window.addEventListener("click", playOnClick, { once: true });
    return () => window.removeEventListener("click", playOnClick);
  }, [videoLoaded]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-[#0f172a] text-white font-['Montserrat']">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-4xl font-bold school-title text-yellow-500 mb-2 font-['Playfair_Display']">
          Shraddha Children Academy, Kottivakkam
        </h1>
        <p className="text-gray-400 tracking-widest uppercase text-xs">
          PE Department Organised
        </p>
      </div>

      {/* Video Container */}
      <div className="video-wrapper group relative w-full max-w-[800px] aspect-video bg-black rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl mb-8">
        {/* Loading / Error UI */}
        {!videoLoaded && (
          <div
            id="videoPlaceholder"
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 z-10"
          >
            <svg
              className="w-16 h-16 text-slate-600 mb-4 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p className="text-slate-400 text-sm mb-4">
              Waiting for video stream...
            </p>
            <label className="cursor-pointer bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
              Tap to select video file
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}

        <video
          ref={videoRef}
          src={videoSrc}
          playsInline
          loop
          controls
          className={`w-full h-full object-cover ${videoLoaded ? "" : "hidden"}`}
          onLoadedData={handleLoadedData}
          onError={() => setVideoLoaded(false)}
        />

        {/* Overlay Tagline */}
        <div className="tagline-banner absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/95 to-transparent p-8 pt-12 text-center pointer-events-none z-10">
          <h2 className="text-3xl md:text-5xl font-black italic text-white mb-1 uppercase tracking-tighter leading-none">
            Move for Health
          </h2>
          <p className="text-yellow-400 font-bold text-sm md:text-lg tracking-wide uppercase">
            7th Health Day Anniversary
          </p>
        </div>
      </div>

      {/* Download and Social Share Buttons */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <a
          href={videoSrc}
          download
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold mb-2 inline-block text-center"
        >
          Download Video
        </a>
        <div className="flex gap-4">
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
            onClick={() => handleShare("whatsapp")}
          >
            <span>Share on WhatsApp</span>
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
            onClick={() => handleShare("facebook")}
          >
            <span>Share on Facebook</span>
          </button>
          <button
            className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
            onClick={() => handleShare("twitter")}
          >
            <span>Share on Twitter</span>
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-8 bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl max-w-2xl border border-slate-700/50 text-center">
        <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
          Our Physical Education department presents a showcase of energy and wellness!
          Students celebrating health through movement and spirit.
        </p>
        <div className="flex justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
          <span className="w-8 h-2 rounded-full bg-slate-600"></span>
          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
        </div>
      </div>
    </div>
  );
}
