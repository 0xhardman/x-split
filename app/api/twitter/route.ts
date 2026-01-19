import { NextRequest, NextResponse } from 'next/server';

interface TweetMediaDetail {
  type: string;
  media_url_https?: string;
  url?: string;
}

interface TweetPhoto {
  url: string;
  expandedUrl?: string;
}

interface TweetData {
  __typename?: string;
  mediaDetails?: TweetMediaDetail[];
  photos?: TweetPhoto[];
}

function extractTweetId(url: string): string | null {
  // Support formats:
  // - https://twitter.com/user/status/123456789
  // - https://x.com/user/status/123456789
  // - https://mobile.twitter.com/user/status/123456789
  // - https://twitter.com/user/status/123456789?s=20
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { success: false, error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  const tweetId = extractTweetId(url);
  if (!tweetId) {
    return NextResponse.json(
      { success: false, error: 'Invalid Twitter/X URL. Expected format: https://twitter.com/user/status/123456789' },
      { status: 400 }
    );
  }

  try {
    // Use Twitter's syndication API (no auth required)
    const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=0`;

    const response = await fetch(syndicationUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; X-Split/1.0)',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Tweet not found. It may have been deleted or is from a private account.' },
          { status: 404 }
        );
      }
      throw new Error(`Failed to fetch tweet: ${response.status}`);
    }

    const data: TweetData = await response.json();

    // Debug: log the response structure
    console.log('Twitter API response:', JSON.stringify(data, null, 2));

    // Extract image URLs from the response
    // The syndication API returns photos in mediaDetails or photos array
    const images: string[] = [];

    if (data.mediaDetails) {
      for (const media of data.mediaDetails) {
        if (media.type === 'photo') {
          // Prefer media_url_https (the actual pbs.twimg.com URL)
          const imageUrl = media.media_url_https;
          if (imageUrl) {
            // Get the highest quality version
            images.push(`${imageUrl}?format=jpg&name=large`);
          }
        }
      }
    }

    // Fallback to photos array if no images found in mediaDetails
    if (images.length === 0 && data.photos) {
      for (const photo of data.photos) {
        // photos array may have expandedUrl with actual image URL
        const imageUrl = photo.expandedUrl || photo.url;
        if (imageUrl && imageUrl.includes('pbs.twimg.com')) {
          images.push(`${imageUrl}?format=jpg&name=large`);
        }
      }
    }

    if (images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images found in this tweet.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error('Error fetching tweet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tweet. Please try again.' },
      { status: 500 }
    );
  }
}
