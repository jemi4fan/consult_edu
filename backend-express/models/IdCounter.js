const mongoose = require('mongoose');

const idCounterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  sequence_value: {
    type: Number,
    default: 0
  }
});

// Static method to get next sequence
idCounterSchema.statics.getNextSequence = function(sequenceName) {
  return this.findByIdAndUpdate(
    sequenceName,
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
};

const IdCounter = mongoose.model('IdCounter', idCounterSchema);

module.exports = IdCounter;

