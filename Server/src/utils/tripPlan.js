function prepareAIInput(places, hotels, numDays) {
  return {
    numDays,
    grouped: {
      touristSpot: places
        .filter((p) => p.type === 'touristSpot')
        .map((p) => ({
          id: p._id,
          name: p.name,
          address: p.address,
          avgPrice: p.avgPrice,
          description: p.description
        })),
      cafe: places
        .filter((p) => p.type === 'cafe')
        .map((p) => ({
          id: p._id,
          name: p.name,
          address: p.address,
          avgPrice: p.avgPrice,
          description: p.description
        })),
      restaurant: places
        .filter((p) => p.type === 'restaurant')
        .map((p) => ({
          id: p._id,
          name: p.name,
          address: p.address,
          avgPrice: p.avgPrice,
          description: p.description
        })),
      hotel: hotels.map((h) => ({
        id: h._id,
        name: h.name,
        address: h.address,
        avgPrice: h.avgPrice,
        description: h.description
      }))
    }
  };
}

module.exports = { prepareAIInput };
