// import APIFeatures from '../utils/APIFeatures.js';
import multer from 'multer';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import Tour from '../models/tourModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import * as handlerFactory from './handlerFactory.js';

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg') {
    return cb(new AppError('File type unsupported', 400));
  }
  return cb(null, true);
};
export const uploadPhoto = multer({ storage, fileFilter }).fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);
export const processPhoto = catchAsync(async (req, res, next) => {
  if (!req.files || !req.files['imageCover'][0]) return next();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const filename = `tour-${Date.now()}-cover${path.extname(req.files['imageCover'][0].originalname)}`;
  const saveTo = path.resolve(__dirname, '../public/img/tours');
  const filePath = path.join(saveTo, filename);
  await sharp(req.files['imageCover'][0].buffer)
    .resize({ width: 2000, height: 1333 })
    .jpeg({ quality: 90 })
    .toFile(filePath);
  const imageCover = filename;
  const images = [];
  await Promise.all(
    req.files['images'].map(async (file, i) => {
      const filename = `tour-${Date.now()}-${i + 1}${path.extname(file.originalname)}`;
      const saveTo = path.resolve(__dirname, '../public/img/tours');
      const filePath = path.join(saveTo, filename);
      await sharp(file.buffer)
        .resize({ width: 2000, height: 1333 })
        .jpeg({ quality: 90 })
        .toFile(filePath);
      images.push(filename);
    })
  );
  req.body.imageCover = imageCover;
  req.body.images = images;
  next();
});
export const getTopCheapTours = (req, res, next) => {
  req.customQuery = {
    limit: 5,
    sort: 'ratingAverage,price'
  };
  next();
};

export const getTour = handlerFactory.getOne(Tour, 'reviews');
export const getAllTours = handlerFactory.getAll(Tour);
export const deleteTour = handlerFactory.deleteOne(Tour);
export const updateTour = handlerFactory.updateOne(Tour);
export const createTour = handlerFactory.createOne(Tour);

export const searchTourNear = catchAsync(async (req, res, next) => {
  const { latlng } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!latlng || !latlng.includes(',')) {
    return next(
      new AppError('Please provide latlng in the format lat,lng', 400)
    );
  }
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return next(new AppError('Latitude, longitude must be valid numbers', 400));
  }
  if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    return next(new AppError('Invalid latitude or longitude values', 400));
  }
  const places = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lngNum, latNum]
        },
        distanceField: 'distance',
        spherical: true,
        maxDistance: 1000000,
        distanceMultiplier: 0.001
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    results: places.length,
    data: {
      places
    }
  });
});

export const searchTourWithin = catchAsync(async (req, res, next) => {
  const { latlng, unit, dist } = req.params;
  const [lat, lng] = latlng.split(',');
  if (unit !== 'kilometer' && unit !== 'miles') {
    return next(new AppError('distance must be in kilometer or miles', 400));
  }
  if (!latlng || !latlng.includes(',')) {
    return next(
      new AppError('Please provide latlng in the format lat,lng', 400)
    );
  }
  const latNum = Number(lat);
  const lngNum = Number(lng);
  const distNum = Number(dist);
  if (Number.isNaN(latNum) || Number.isNaN(lngNum) || Number.isNaN(distNum)) {
    return next(
      new AppError(
        'Latitude, longitude, and distance must be valid numbers',
        400
      )
    );
  }
  if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    return next(new AppError('Invalid latitude or longitude values', 400));
  }
  if (distNum <= 0) {
    return next(new AppError('Distance must be a positive number', 400));
  }
  const radius = unit === 'kilometer' ? dist / 6371 : dist / 3963;
  const places = await Tour.aggregate([
    {
      $match: {
        startLocation: {
          $geoWithin: {
            $centerSphere: [[Number(lng), Number(lat)], radius]
          }
        }
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    results: places.length,
    data: {
      places
    }
  });
});
export const monthlyPlan = catchAsync(async (req, res) => {
  const { year } = req.params;
  const cursor = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: {
          $month: '$startDates'
        },
        tours: {
          $push: '$name'
        },
        numToursStart: {
          $sum: 1
        }
      }
    },
    {
      $limit: 12
    },
    {
      $sort: {
        numToursStarts: -1
      }
    },
    {
      $addFields: {
        month: '$_id'
      }
    },
    {
      $project: {
        _id: 0
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    results: cursor.length,
    data: {
      cursor
    }
  });
});
export const groupByDifficulty = catchAsync(async (req, res) => {
  const cursor = await Tour.aggregate([
    {
      $match: {
        ratingAverage: {
          $gte: 4.5
        }
      }
    },
    {
      $group: {
        _id: {
          $toUpper: '$difficulty'
        },
        numTours: {
          $sum: 1
        },
        numRatings: {
          $sum: '$ratingsQuantity'
        },
        avgRating: {
          $avg: '$ratingsAverage'
        },
        avgPrice: {
          $avg: '$price'
        },
        minPrice: {
          $min: '$price'
        },
        maxPrice: {
          $max: '$price'
        }
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    results: cursor.length,
    data: {
      cursor
    }
  });
});
