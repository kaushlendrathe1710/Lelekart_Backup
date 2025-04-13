import { Request, Response } from 'express';
import axios from 'axios';

export async function handleImageProxy(req: Request, res: Response) {
  const imageUrl = req.query.url as string;
  
  if (!imageUrl) {
    return res.status(400).send('Missing url parameter');
  }
  
  try {
    // Validate URL
    const url = new URL(imageUrl);
    // Only allow specific domains
    if (!url.hostname.includes('flixcart.com') && 
        !url.hostname.includes('flipkart.com')) {
      return res.status(403).send('Unauthorized domain');
    }
    
    // Fetch the image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.flipkart.com/'
      }
    });
    
    // Set the content type header and send the image data
    res.set('Content-Type', response.headers['content-type']);
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    return res.send(response.data);
    
  } catch (error) {
    console.error('Image proxy error:', error);
    return res.status(500).send('Error fetching image');
  }
}