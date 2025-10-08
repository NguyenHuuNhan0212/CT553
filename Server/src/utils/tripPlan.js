function prepareAIInput(places, hotels, numDays) {
  console.log(places);
  return {
    numDays,
    grouped: {
      touristSpot: places
        .filter((p) => p.type === 'touristSpot')
        .map((p) => ({
          id: p._id,
          name: p.name,
          address: p.address,
          description: p.description,
          services: p.services
        })),
      cafe: places
        .filter((p) => p.type === 'cafe')
        .map((p) => ({
          id: p._id,
          name: p.name,
          address: p.address,
          description: p.description,
          services: p.services
        })),
      restaurant: places
        .filter((p) => p.type === 'restaurant')
        .map((p) => ({
          id: p._id,
          name: p.name,
          address: p.address,
          description: p.description,
          services: p.services
        })),
      hotel: hotels.map((h) => ({
        id: h._id,
        name: h.name,
        address: h.address,
        description: h.description,
        services: h.services
      }))
    }
  };
}

module.exports = { prepareAIInput };
