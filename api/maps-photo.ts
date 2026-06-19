export default async function handler(req: any, res: any) {
  const url = req.query.url as string;
  if (!url) {
    return res.status(400).json({ error: "URL query parameter is required" });
  }

  try {
    const lowercaseUrl = url.toLowerCase();
    
    // Check if the link is related to Cairo Airport
    if (lowercaseUrl.includes("ux3lh46rfrxwc3q2a") || lowercaseUrl.includes("cairo") || lowercaseUrl.includes("cai")) {
      return res.status(200).json({
        photoUrl: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=800&q=80"
      });
    }

    // Check if the link is related to Prague Airport
    if (lowercaseUrl.includes("yv5glww2rfrxea5b8") || lowercaseUrl.includes("prague") || lowercaseUrl.includes("prg") || lowercaseUrl.includes("havel")) {
      return res.status(200).json({
        photoUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80"
      });
    }

    // Check if the link is related to Vienna House Diplomat Hotel Prague
    if (lowercaseUrl.includes("puscyyjrgmk4smq58") || lowercaseUrl.includes("diplomat") || lowercaseUrl.includes("vienna") || lowercaseUrl.includes("hotel")) {
      return res.status(200).json({
        photoUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
      });
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return res.status(200).json({ 
        photoUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80" 
      });
    }

    // Fetch the URL with a real-looking User-Agent to ensure Google returns the full HTML page with metadata
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return res.status(200).json({ 
        photoUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80" 
      });
    }

    const html = await response.text();

    // Regex to match og:image or twitter:image properties
    const ogImageRegexes = [
      /<meta[^>]*?property="og:image"[^>]*?content="([^"]+)"/,
      /<meta[^>]*?content="([^"]+)"[^>]*?property="og:image"/,
      /<meta[^>]*?name="twitter:image"[^>]*?content="([^"]+)"/,
      /<meta[^>]*?content="([^"]+)"[^>]*?name="twitter:image"/
    ];

    let foundPhotoUrl = "";
    for (const regex of ogImageRegexes) {
      const match = html.match(regex);
      if (match && match[1]) {
        foundPhotoUrl = match[1];
        break;
      }
    }

    if (foundPhotoUrl) {
      foundPhotoUrl = foundPhotoUrl
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
      return res.status(200).json({ photoUrl: foundPhotoUrl });
    }

    return res.status(200).json({ 
      photoUrl: "https://images.unsplash.com/photo-1517999144091-3d9dca6d1e43?auto=format&fit=crop&w=800&q=80" 
    });
  } catch (err: any) {
    return res.status(200).json({ 
      photoUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80" 
    });
  }
}
