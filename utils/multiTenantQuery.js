import mongoose from "mongoose";

class MultiTenantQueryBuilder {
  constructor(Model, organizationId) {
    ((this.Model = Model),
      (this.organizationId = organizationId),
      (this.query = null));
    this.operation = null;
  }

  find(filter = {}) {
    ((this.operation = "find"),
      (this.query = this.Model.find({
        organizationId: this.organizationId,
        ...filter,
      })));
    return this;
  }

  findOne(filter = {}) {
    ((this.operation = "findOne"),
      (this.query = this.Model.findOne({
        organizationId: this.organizationId,
        ...filter,
      })));
    return this;
  }

  findById(id) {
    ((this.operation = "findById"),
      (this.query = this.Model.findOne({
        _id: id,
        organizationId: this.organizationId,
      })));
    return this;
  }

  updateOne(filter, update) {
    ((this.operation = "updateOne"),
      (this.query = this.Model.updateOne({
        organizationId: this.organizationId,
        ...filter,
      })));
    return this;
  }

  updateMany(filter, update) {
    ((this.operation = "updateMany"),
      (this.query = this.Model.updateMany({
        organizationId: this.organizationId,
        ...filter,
      })));
    return this;
  }

  deleteOne(filter) {
    ((this.operation = "deleteOne"),
      (this.query = this.Model.deleteOne({
        organizationId: this.organization,
        ...filter,
      })));
    return this;
  }

  deleteMany(filter) {
    ((this.operation = "deleteMany"),
      (this.query = this.Model.deleteMany({
        organizationId: this.organizationId,
        ...filter,
      })));
  }

  //Query modifiers
  select(fields) {
    if (this.query && this.query.select) {
      this.query.select(fields);
    }
  }

  populate(fields) {
    if (this.query && this.query.populate) {
      this.query.populate(fields);
    }
  }
  sort(sortOptions) {
    if (this.query && this.query.sort) {
      this.query.sort(sortOptions);
    }
    return this;
  }

  limit(limitValue) {
    if (this.query && this.query.limit) {
      this.query.limit(limitValue);
    }
    return this;
  }

  skip(skipValue) {
    if (this.query && this.query.skip) {
      this.query.skip(skipValue);
    }
    return this;
  }

  lean(value = true) {
    if (this.query && this.query.lean) {
      this.query.lean(value);
    }
    return this;
  }
  async exec() {
    if (!this.query) {
      throw new Error("No query to execute");
    }
    return await this.query.exec();
  }

  // Promise support
  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

// Factory function
export const multiTenantQuery = (Model, organizationId) => {
  if (!organizationId) {
    throw new Error("organizationId is required for multi-tenant queries");
  }
  return new MultiTenantQueryBuilder(Model, organizationId);
};

// Export for default import
export default multiTenantQuery;
