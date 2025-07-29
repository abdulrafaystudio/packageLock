
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play } from 'lucide-react';
import { validateUrl, sanitizeHtml } from '@/utils/security';

interface VideoPreviewProps {
  videoLink: string;
  title: string;
}

const VideoPreview = ({ videoLink, title }: VideoPreviewProps) => {
  // Validate the video URL for security
  if (!validateUrl(videoLink)) {
    console.warn('Invalid video URL provided:', videoLink);
    return null;
  }

  // Sanitize the title
  const sanitizedTitle = sanitizeHtml(title);

  // Extract video ID and determine platform
  const getVideoInfo = (url: string) => {
    // YouTube patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    
    if (youtubeMatch) {
      return {
        platform: 'youtube',
        videoId: youtubeMatch[1],
        thumbnailUrl: `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`
      };
    }

    // Vimeo patterns
    const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    
    if (vimeoMatch) {
      return {
        platform: 'vimeo',
        videoId: vimeoMatch[1],
        thumbnailUrl: `https://vumbnail.com/${vimeoMatch[1]}.jpg`,
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`
      };
    }

    // For unsupported platforms, return a generic structure
    return {
      platform: 'other',
      videoId: null,
      thumbnailUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgdmlld0JveD0iMCAwIDY0MCAzNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2NDAiIGhlaWdodD0iMzYwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yODAgMjAwVjE2MEwyMjAgMTgwVjIwMEwyODAgMjAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K',
      embedUrl: null
    };
  };

  const videoInfo = getVideoInfo(videoLink);

  const handleVideoClick = () => {
    // Additional security check before opening
    if (validateUrl(videoLink)) {
      window.open(videoLink, '_blank', 'noopener noreferrer');
    }
  };

  return (
    <Card className="mb-8 bg-white border-gray-200">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Video</h2>
        <div 
          className="relative cursor-pointer group rounded-lg overflow-hidden bg-gray-100"
          onClick={handleVideoClick}
        >
          <div className="aspect-video relative">
            <img
              src={videoInfo.thumbnailUrl}
              alt={`${sanitizedTitle} video preview`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback for failed thumbnail loads
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgdmlld0JveD0iMCAwIDY0MCAzNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2NDAiIGhlaWdodD0iMzYwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yODAgMjAwVjE2MEwyMjAgMTgwVjIwMEwyODAgMjAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
              <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:bg-opacity-100 transition-all duration-200">
                <Play className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <p className="text-white text-sm font-medium">Click to watch video</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPreview;
