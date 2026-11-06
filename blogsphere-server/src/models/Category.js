const mongoose = require('mongoose');
const { CATEGORIES_LIST } = require('../constants/articles');

/**
 * Display metadata for a category (name, icon, colour, order).
 * Articles reference categories by slug (Article.category), so the allowed
 * slugs stay defined in constants/articles.js.
 */
const CategorySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      enum: {
        values: CATEGORIES_LIST,
        message: '{VALUE} is not a supported category'
      }
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [60, 'Category name cannot exceed 60 characters']
    },
    icon: {
      type: String,
      default: '📄'
    },
    color: {
      type: String,
      default: '#B69B75'
    },
    description: {
      type: String,
      default: '',
      maxlength: [300, 'Description cannot exceed 300 characters']
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Category', CategorySchema);
