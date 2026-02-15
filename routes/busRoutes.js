const express = require('express');
const router = express.Router();
const { getDB } = require('../services/db');
const { ObjectId } = require('mongodb');

// Register bus
router.post('/bus/register', async (req, res) => {
  try {
    const { busName, busNumber, deviceId } = req.body;
    const db = getDB();
    const buses = db.collection('buses');

    let bus = await buses.findOne({ deviceId });
    if (!bus) {
      const result = await buses.insertOne({ 
        busName, 
        busNumber, 
        deviceId, 
        isActive: false, 
        currentLocation: { lat: 0, lng: 0 }, 
        lastUpdated: new Date() 
      });
      bus = { _id: result.insertedId, busName, busNumber, deviceId };
    }
    res.json({ busId: bus._id });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Start trip
router.post('/bus/:id/start', async (req, res) => {
  try {
    const db = getDB();
    const buses = db.collection('buses');
    const busId = req.params.id;

    const result = await buses.updateOne(
      { _id: new ObjectId(busId) },
      { $set: { isActive: true } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ msg: 'Bus not found' });
    res.json({ msg: 'Trip started' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Stop trip
router.post('/bus/:id/stop', async (req, res) => {
  try {
    const db = getDB();
    const buses = db.collection('buses');
    const busLocations = db.collection('bus_locations');
    const busId = req.params.id;

    const result = await buses.updateOne(
      { _id: new ObjectId(busId) },
      { $set: { isActive: false } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ msg: 'Bus not found' });

    await busLocations.deleteMany({ busId: new ObjectId(busId) });
    res.json({ msg: 'Trip stopped, previous locations deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Update location
router.post('/location/update', async (req, res) => {
  try {
    const { busId, deviceId, latitude, longitude } = req.body;
    const db = getDB();
    const buses = db.collection('buses');
    const busLocations = db.collection('bus_locations');

    const bus = await buses.findOne({ _id: new ObjectId(busId) });
    if (!bus) return res.status(404).json({ msg: 'Bus not found' });
    if (bus.deviceId !== deviceId) return res.status(403).json({ msg: 'Unauthorized device' });

    await buses.updateOne(
      { _id: new ObjectId(busId) },
      { 
        $set: { currentLocation: { lat: latitude, lng: longitude }, lastUpdated: new Date() } 
      }
    );

    if (bus.isActive) {
      await busLocations.insertOne({ busId: new ObjectId(busId), lat: latitude, lng: longitude, timestamp: new Date() });
    }

    res.json({ msg: 'Location updated' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get active buses
router.get('/bus/active', async (req, res) => {
  try {
    const db = getDB();
    const buses = db.collection('buses');
    const activeBuses = await buses.find({ isActive: true }).toArray();
    res.json(activeBuses);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
