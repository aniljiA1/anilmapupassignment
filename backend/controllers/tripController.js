exports.getTripCost = async (req, res) => {
   const { tripId } = req.params;
   res.json({ tripId, cost: 1200 });
};
