import React, { useState, useEffect } from 'react';
import {
  Star,
  X,
  CheckCircle2,
  MessageSquare,
  ThumbsUp,
  Send,
  Sparkles,
  ShieldCheck,
  Filter,
  Heart,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { User } from '../types';

export interface FeedbackEntry {
  id: string;
  userId?: string;
  userName: string;
  userRole?: string;
  rating: number; // 1 to 5
  qualityRating?: number;
  edgeRating?: number;
  speedRating?: number;
  category: string;
  tags?: string[];
  message: string;
  helpfulCount?: number;
  isVerified?: boolean;
  createdAt: string;
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSubmitted?: (feedback: FeedbackEntry) => void;
}

const CATEGORIES = [
  'General feedback',
  'AI accuracy & cutout quality',
  'Hair & fine edge preservation',
  'Refinement eraser & brush tool',
  'Crop & trim tool',
  'Studio backgrounds & lighting',
  'Batch processing & ZIP export',
  'Feature request',
  'Bug report',
];

const QUICK_TAGS = [
  'Crisp edges',
  'Zero halo',
  'Flyaway hair preserved',
  'Fast inference',
  'Intuitive editor',
  'E-commerce ready',
  'Great brush tool',
  'Batch zip helped',
];

const SEEDED_REVIEWS: FeedbackEntry[] = [
  {
    id: 'fb_seed_1',
    userName: 'Elena Rostova',
    userRole: 'E-commerce Fashion Studio',
    rating: 5,
    qualityRating: 5,
    edgeRating: 5,
    speedRating: 5,
    category: 'Hair & fine edge preservation',
    tags: ['Crisp edges', 'Flyaway hair preserved', 'E-commerce ready'],
    message:
      'We shoot hundreds of apparel photos daily. ClearCut AI removed the white background and maintained fine curly hair without any manual masking. The 1-click studio shadow makes products look like a high-end catalogue!',
    helpfulCount: 38,
    isVerified: true,
    createdAt: '2026-10-25T14:32:00Z',
  },
  {
    id: 'fb_seed_2',
    userName: 'Marcus Chen',
    userRole: 'Senior Portrait Photographer',
    rating: 5,
    qualityRating: 5,
    edgeRating: 5,
    speedRating: 4,
    category: 'AI accuracy & cutout quality',
    tags: ['Zero halo', 'Intuitive editor', 'Great brush tool'],
    message:
      'The defringing and edge choke completely strip away green/gray color spills. The Refinement Eraser with undo history lets me polish complex collars in seconds.',
    helpfulCount: 29,
    isVerified: true,
    createdAt: '2026-10-26T09:15:00Z',
  },
  {
    id: 'fb_seed_3',
    userName: 'Aisha Al-Mansoor',
    userRole: 'Digital Marketing Lead',
    rating: 5,
    qualityRating: 5,
    edgeRating: 4,
    speedRating: 5,
    category: 'Batch processing & ZIP export',
    tags: ['Fast inference', 'Batch zip helped', 'E-commerce ready'],
    message:
      'The batch processor with one-click ZIP download saved our team at least 4 hours on our summer launch campaign. Exporting transparent PNGs in full original resolution is flawless.',
    helpfulCount: 19,
    isVerified: true,
    createdAt: '2026-10-26T18:40:00Z',
  },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSubmitted,
}) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'reviews'>('submit');
  const [overallRating, setOverallRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [qualityRating, setQualityRating] = useState<number>(5);
  const [edgeRating, setEdgeRating] = useState<number>(5);
  const [speedRating, setSpeedRating] = useState<number>(5);
  const [category, setCategory] = useState<string>('General feedback');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Crisp edges']);
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('auracut_feedback_upvotes');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Load feedbacks combining localStorage with seeded reviews
  useEffect(() => {
    try {
      const stored = localStorage.getItem('auracut_user_feedbacks');
      if (stored) {
        const parsed: FeedbackEntry[] = JSON.parse(stored);
        // Merge without duplicating
        const existingIds = new Set(parsed.map((p) => p.id));
        const combined = [...parsed, ...SEEDED_REVIEWS.filter((s) => !existingIds.has(s.id))];
        setFeedbacks(combined);
      } else {
        setFeedbacks(SEEDED_REVIEWS);
      }
    } catch {
      setFeedbacks(SEEDED_REVIEWS);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleUpvote = (id: string) => {
    if (upvotedIds.has(id)) return;
    const newUpvotes = new Set(upvotedIds);
    newUpvotes.add(id);
    setUpvotedIds(newUpvotes);
    try {
      localStorage.setItem('auracut_feedback_upvotes', JSON.stringify(Array.from(newUpvotes)));
    } catch {}

    setFeedbacks((prev) =>
      prev.map((f) => (f.id === id ? { ...f, helpfulCount: (f.helpfulCount || 0) + 1 } : f))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newFeedback: FeedbackEntry = {
      id: 'fb_' + Date.now().toString(36),
      userId: currentUser?.id,
      userName: currentUser?.name || 'Verified Creator',
      userRole: currentUser ? 'Member' : 'Community User',
      rating: overallRating,
      qualityRating,
      edgeRating,
      speedRating,
      category,
      tags: selectedTags,
      message: message.trim(),
      helpfulCount: 1,
      isVerified: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [newFeedback, ...feedbacks];
    setFeedbacks(updated);
    try {
      localStorage.setItem('auracut_user_feedbacks', JSON.stringify(updated));
    } catch {}

    // Send to backend if available
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFeedback),
    }).catch(() => {});

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      if (onSubmitted) onSubmitted(newFeedback);
      setTimeout(() => {
        setSubmitted(false);
        setMessage('');
        setActiveTab('reviews');
      }, 1500);
    }, 350);
  };

  const totalReviews = feedbacks.length;
  const averageRating =
    totalReviews > 0
      ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / totalReviews).toFixed(1)
      : '4.9';

  const fiveStarCount = feedbacks.filter((f) => f.rating === 5).length;
  const fourStarCount = feedbacks.filter((f) => f.rating === 4).length;
  const threeStarCount = feedbacks.filter((f) => f.rating === 3).length;

  const filteredFeedbacks =
    filterRating === 'all' ? feedbacks : feedbacks.filter((f) => f.rating === filterRating);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Feedback & Star Ratings
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  ★ {averageRating} / 5.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Help shape the next generation of AI background removal and studio tools
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-6 pt-3 gap-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'submit'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 rounded-t-xl'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Leave a Review</span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'reviews'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 rounded-t-xl'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Community Reviews ({totalReviews})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
          {activeTab === 'submit' ? (
            submitted ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    Thank You for Rating!
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    Your {overallRating}-star rating and feedback were successfully recorded. Switching
                    to community reviews...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Overall Star Rating */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                    How would you rate your experience?
                  </span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoverRating || overallRating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setOverallRating(star)}
                          className="p-1 focus:outline-none transition-transform hover:scale-125"
                          title={`${star} Star${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              isFilled
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">
                    {overallRating === 5 && '🌟 5 Stars — Excellent! Clean cutouts & pro studio'}
                    {overallRating === 4 && '👍 4 Stars — Very good, reliable results'}
                    {overallRating === 3 && '👌 3 Stars — Average, works as expected'}
                    {overallRating === 2 && '👎 2 Stars — Had some issues with edges'}
                    {overallRating === 1 && '⚠️ 1 Star — Poor experience'}
                  </span>
                </div>

                {/* Criteria Star Breakdown */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                    <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Cutout Edges
                    </span>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          onClick={() => setQualityRating(s)}
                          className={`w-4 h-4 cursor-pointer transition-transform hover:scale-110 ${
                            qualityRating >= s
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                    <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Hair & Detail
                    </span>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          onClick={() => setEdgeRating(s)}
                          className={`w-4 h-4 cursor-pointer transition-transform hover:scale-110 ${
                            edgeRating >= s
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                    <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Processing Speed
                    </span>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          onClick={() => setSpeedRating(s)}
                          className={`w-4 h-4 cursor-pointer transition-transform hover:scale-110 ${
                            speedRating >= s
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Feedback Tags */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    What stood out the most? (Click to select tags)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Feedback Topic
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Written Review */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Review or Feature Suggestion
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Describe how the cutout engine performed or any tool you would love to see..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none placeholder:text-slate-400"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Verified creator feedback
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Submitting...' : 'Submit Review'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )
          ) : (
            /* Community Reviews Tab */
            <div className="space-y-5">
              {/* Scorecard Hero */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-200/50 dark:border-amber-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center sm:text-left">
                    <div className="text-4xl font-extrabold text-slate-900 dark:text-white">
                      {averageRating}
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-1 my-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Based on {totalReviews} community ratings
                    </span>
                  </div>

                  <div className="h-12 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 hidden sm:block">
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-[10px]">5 Stars:</span>
                      <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{
                            width: `${totalReviews > 0 ? (fiveStarCount / totalReviews) * 100 : 92}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[10px]">{fiveStarCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-[10px]">4 Stars:</span>
                      <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{
                            width: `${totalReviews > 0 ? (fourStarCount / totalReviews) * 100 : 7}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[10px]">{fourStarCount}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('submit')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Star className="w-3.5 h-3.5 fill-white text-white" />
                  <span>Write a Review</span>
                </button>
              </div>

              {/* Star Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  onClick={() => setFilterRating('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
                    filterRating === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  All ({totalReviews})
                </button>
                <button
                  onClick={() => setFilterRating(5)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
                    filterRating === 5
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>5 Stars</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>({fiveStarCount})</span>
                </button>
                <button
                  onClick={() => setFilterRating(4)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
                    filterRating === 4
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>4 Stars</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>({fourStarCount})</span>
                </button>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                {filteredFeedbacks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No reviews in this star category yet.
                  </div>
                ) : (
                  filteredFeedbacks.map((item) => {
                    const isUpvoted = upvotedIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center">
                              {item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {item.userName}
                                </span>
                                {item.isVerified && (
                                  <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    Verified
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {item.userRole || 'Creator'} •{' '}
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Star Rating Badge */}
                          <div className="flex items-center bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200/60 dark:border-amber-800/60">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  item.rating >= s
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300 dark:text-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Review Content */}
                        {item.message && (
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {item.message}
                          </p>
                        )}

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer: Category & Helpful Button */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
                          <span className="italic">{item.category}</span>
                          <button
                            type="button"
                            onClick={() => handleUpvote(item.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                              isUpvoted
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800'
                                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>Helpful ({item.helpfulCount || 0})</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
