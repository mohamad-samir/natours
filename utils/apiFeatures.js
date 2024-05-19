class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    // 1. Extract pagination parameters from the query string
    const page = this.queryString.page * 1 || 1; // Convert page parameter to number, default to 1 if not provided
    const limit = this.queryString.limit * 1 || 100; // Convert limit parameter to number, default to 100 if not provided

    // 2. Calculate the number of documents to skip based on page and limit
    const skip = (page - 1) * limit;

    // 3. Apply skip and limit to the current query
    this.query = this.query.skip(skip).limit(limit);

    // 4. Return this (for chaining purposes)
    return this;
  }
}
module.exports = APIFeatures;
