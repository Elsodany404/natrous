import catchAsync from '../utils/catchAsync.js';
import APIFeatures from '../utils/APIFeatures.js';

export const deleteOne = (Model) => {
  return catchAsync(async (req, res) => {
    await Model.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: {
        doc: null
      }
    });
  });
};
export const createOne = (Model) => {
  return catchAsync(async (req, res) => {
    const doc = await Model.create(req.body);
    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });
};
export const updateOne = (Model) => {
  return catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });
};
export const getAll = (Model) => {
  return catchAsync(async (req, res) => {
    let filter = {};
    if (req.params.tourId) filter = { _id: req.params.tourId };
    const queryParams = req.customQuery || req.query;

    const features = new APIFeatures(Model, Model.find(filter), queryParams)
      .filtering()
      .sorting()
      .fieldsLimiting()
      .paginating();
    const docs = await features.query;
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        docs
      }
    });
  });
};
export const getOne = (Model, population) => {
  return catchAsync(async (req, res, next) => {
    const query = await Model.findById(req.params.id);
    if (population) {
      query.populate(population);
    }
    const doc = await query;
    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });
};
