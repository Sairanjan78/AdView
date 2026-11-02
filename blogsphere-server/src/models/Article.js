const mongoose = require('mongoose');
const { ARTICLE_STATUS, CATEGORIES_LIST } = require('../constants/articles');

const ArticleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an article title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true
    },
    excerpt: {
      type: String,
      required: [true, 'Please provide a short excerpt / summary'],
      trim: true,
      maxlength: [300, 'Excerpt cannot exceed 300 characters']
    },
    content: {
      type: String,
      required: [true, 'Please provide the article content']
    },
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80'
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: {
        values: CATEGORIES_LIST,
        message: '{VALUE} is not a valid category'
      },
      lowercase: true,
      index: true
    },
    tags: {
      type: [String],
      default: [],
      index: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(ARTICLE_STATUS),
      default: ARTICLE_STATUS.DRAFT,
      index: true
    },
    readTime: {
      type: Number,
      default: 1
    },
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    publishedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Helper function to create slug
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Pre-save hook: auto-generate unique slug & calculate read time
ArticleSchema.pre('save', async function (next) {
  if (this.isModified('title') || !this.slug) {
    let baseSlug = slugify(this.title);
    if (!baseSlug) baseSlug = 'article';
    let uniqueSlug = baseSlug;
    let count = 1;

    // Check if slug already exists
    while (await this.constructor.findOne({ slug: uniqueSlug, _id: { $ne: this._id } })) {
      uniqueSlug = `${baseSlug}-${count}`;
      count++;
    }
    this.slug = uniqueSlug;
  }

  // Calculate estimated read time (average ~200 words per minute)
  if (this.isModified('content') && this.content) {
    const plainText = this.content.replace(/<[^>]*>?/gm, '');
    const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
    this.readTime = Math.max(1, Math.ceil(wordCount / 200));
  }

  // Set publishedAt timestamp when published
  if (this.isModified('status') && this.status === ARTICLE_STATUS.PUBLISHED && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

module.exports = mongoose.model('Article', ArticleSchema);

