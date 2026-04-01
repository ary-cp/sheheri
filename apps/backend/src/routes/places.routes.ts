import { Router } from 'express';
import Place from '../models/Place.model';

const router = Router();

// GET /api/places/:googlePlaceId
router.get('/:googlePlaceId', async (req, res) => {
  try {
    const place = await Place.findOne({ 
      googlePlaceId: req.params.googlePlaceId 
    });
    
    if (!place) {
      return res.status(404).json({ error: 'Place nahi mila' });
    }
    
    res.json(place);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch place' });
  }
});

export default router;