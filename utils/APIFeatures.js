class APIFeatures {
  constructor(Model, query, queryStr) {
    this.Model = Model;
    this.query = query;
    this.queryStr = queryStr;
  }

  filtering() {
    // Removing excluded field
    const queryObj = {
      ...this.queryStr
    };
    const excludedFields = ['sort', 'page', 'fields', 'limit'];
    excludedFields.forEach((field) => delete queryObj[field]);
    // adding operators
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gt|gte|lt|lte)\b/g,
      (match) => `$${match}`
    );
    this.query = this.Model.find(JSON.parse(queryString));
    return this;
  }

  sorting() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    }
    return this;
  }

  fieldsLimiting() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginating() {
    const page = Number(this.queryStr.page) || 1;
    const limit = Number(this.queryStr.limit) || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

export default APIFeatures;
