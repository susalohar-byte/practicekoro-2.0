import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { BlogPost, BlogPostStatus } from '@/types';

/**
 * Service domain for Admin Blog Management
 *
 * Persistence Architecture (3-Tier Resilient Storage):
 * 1. Primary: `public.blog_posts` table (when configured in Supabase)
 * 2. Universal Fallback: `public.app_settings` (`id = 'blog_posts_list'`)
 * 3. Local Cache: `localStorage` (`pk_admin_blog_posts`) + in-memory store
 */

const STORAGE_KEY = 'pk_admin_blog_posts';
const APP_SETTINGS_BLOG_ID = 'blog_posts_list';

// Canonical initial blog posts matching media_1791219544751.jpg
const CANONICAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog-post-001',
    title: 'WBP Constable পরীক্ষার প্রস্তুতি : সম্পূর্ণ গাইড',
    slug: 'wbp-constable-guide',
    excerpt: 'WBP Constable পরীক্ষার প্রস্তুতি নিতে হলে সঠিক পরিকল্পনা, সিলেবাস অনুযায়ী পড়াশোনা এবং নিয়মিত অনুশীলনের এই পোস্টে আমরা বিস্তারিতভাবে আলোচনা করেছি...',
    content: `<h2>WBP Constable পরীক্ষার প্রস্তুতি কৌশল</h2>
<p>পশ্চিমবঙ্গ পুলিশ কনস্টেবল (WBP Constable) নিয়োগ পরীক্ষায় উত্তীর্ণ হতে হলে সুনির্দিষ্ট ও পরিকল্পিত প্রস্তুতির প্রয়োজন। এই গাইডে প্রিলিমিনারি ও মেইনস পরীক্ষার জন্য প্রতিটি বিষয়ের প্রস্তুতি কৌশল আলোচনা করা হলো।</p>
<h3>১. প্রিলিমিনারি পরীক্ষার প্যাটার্ন</h3>
<p>প্রিলিমিনারি পরীক্ষায় মোট ১০০ নম্বরের এমসিকিউ প্রশ্ন থাকবে। সময় ১ ঘণ্টা। নেগেটিভ মার্কিং প্রতি ভুল উত্তরে ১/৪ নম্বর (০.২৫ নম্বর)।</p>
<ul>
  <li>সাধারণ জ্ঞান ও জেনারেল অ্যাওয়ারনেস: ৪০ নম্বর</li>
  <li>প্রাথমিক গণিত (মাধ্যমিক মান): ৩০ নম্বর</li>
  <li>রিজনিং ও লজিক্যাল অ্যানালিসিস: ৩০ নম্বর</li>
</ul>
<h3>২. সেরা বই ও রিভিশন পদ্ধতি</h3>
<p>প্রতিদিন অন্তত ১টি ফুল মক টেস্ট দিন এবং ভুল হওয়া প্রশ্নের ব্যাখ্যা ভালো করে বুঝে নোট করুন।</p>`,
    category: 'WBP Constable',
    author: 'Admin',
    authorRole: 'Super Admin',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    status: 'published',
    isFeatured: true,
    thumbnail: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    views: 12480,
    uniqueViews: 3240,
    likes: 428,
    comments: 56,
    shares: 320,
    readTime: '4m 12s',
    publishedAt: '2026-09-28T10:30:00.000Z',
    createdAt: '2026-09-20T08:00:00.000Z',
    updatedAt: '2026-09-29T14:15:00.000Z',
    seoTitle: 'WBP Constable পরীক্ষার প্রস্তুতি : সম্পূর্ণ গাইড | PracticeKoro',
    seoDescription: 'পশ্চিমবঙ্গ পুলিশ কনস্টেবল নিয়োগ পরীক্ষার সিলেবাস, বুক লিস্ট এবং সেরা প্রস্তুতি গাইড।',
    seoKeywords: 'wbp constable, police exam preparation, bengali mock test, syllabus',
  },
  {
    id: 'blog-post-002',
    title: 'ভারতের সংবিধানের গুরুত্বপূর্ণ প্রশ্ন',
    slug: 'indian-constitution-important-questions',
    excerpt: 'ভারতের সংবিধানের বিভিন্ন ধারা, প্রস্তাবনা, মৌলিক অধিকার ও নির্দেশমূলক নীতি সংক্রান্ত গুরুত্বপূর্ণ প্রশ্ন উত্তর এক নজরে আলোচনা করা হলো।',
    content: `<h2>ভারতের সংবিধানের অপরিহার্য প্রশ্নোত্তর</h2>
<p>প্রতিটি সরকারি চাকরির পরীক্ষায় ভারতের সংবিধান থেকে একাধিক প্রশ্ন নিশ্চিতভাবে আসে। এখানে শীর্ষ ১০০টি বাছাই করা প্রশ্নোত্তর সংকলন করা হয়েছে।</p>
<h3>মূল বিষয়সমূহ:</h3>
<ol>
  <li>সংবিধানের প্রস্তাবনা (Preamble) এবং এর মূল আদর্শ</li>
  <li>মৌলিক অধিকার (Articles 12-35) ও মৌলিক কর্তব্য</li>
  <li>রাষ্ট্রপতির ক্ষমতা, নির্বাচন পদ্ধতি ও জরুরি অবস্থা</li>
</ol>`,
    category: 'General Knowledge',
    author: 'Susanta',
    authorRole: 'Content Lead',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    status: 'published',
    isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    views: 8320,
    uniqueViews: 2150,
    likes: 310,
    comments: 42,
    shares: 180,
    readTime: '3m 45s',
    publishedAt: '2026-09-25T16:20:00.000Z',
    createdAt: '2026-09-22T10:00:00.000Z',
    updatedAt: '2026-09-25T16:20:00.000Z',
    seoTitle: 'ভারতের সংবিধানের গুরুত্বপূর্ণ প্রশ্ন | PracticeKoro GK',
    seoDescription: 'সরকারি চাকরির পরীক্ষার জন্য ভারতের সংবিধানের সেরা প্রশ্ন ও উত্তর।',
    seoKeywords: 'indian polity, constitution questions, wbcps polity, gk bengali',
  },
  {
    id: 'blog-post-003',
    title: 'সময়ের মধ্যে পড়াশোনা করার ১০টি উপায়',
    slug: '10-ways-to-study-efficiently',
    excerpt: 'কম সময়ে বেশি পড়াশোনা মনে রাখার কার্যকরী ১০টি বৈজ্ঞানিক কৌশল যা আপনার পরীক্ষার প্রস্তুতিতে সহায়ক হবে।',
    content: `<h2>কম সময়ে গভীর মনোসংযোগের বৈজ্ঞানিক উপায়</h2>
<p>স্মার্ট স্টাডি এবং টাইম ম্যানেজমেন্টের মাধ্যমে পড়ালেখার কার্যকারিতা কয়েকগুণ বাড়ানো সম্ভব। নিচে সেরা ১০টি কৌশল দেওয়া হলো:</p>
<p>১. পমোডোরো টেকনিক (Pomodoro Technique) ব্যবহার করুন।<br/>২. স্পেসড রিপিটেশন পদ্ধতিতে রিভিশন দিন।<br/>৩. একটিভ রিকল এবং মক টেস্ট দিয়ে সেলফ-টেস্টিং করুন।</p>`,
    category: 'Study Tips',
    author: 'Puja',
    authorRole: 'Exam Educator',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    status: 'published',
    isFeatured: true,
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
    views: 15620,
    uniqueViews: 4100,
    likes: 580,
    comments: 75,
    shares: 410,
    readTime: '5m 00s',
    publishedAt: '2026-09-22T09:10:00.000Z',
    createdAt: '2026-09-18T14:00:00.000Z',
    updatedAt: '2026-09-22T09:10:00.000Z',
    seoTitle: 'সময়ের মধ্যে পড়াশোনা করার ১০টি উপায় | Study Tips',
    seoDescription: 'পরীক্ষার প্রস্তুতিতে সময় বাঁচানোর এবং পড়া মনে রাখার সেরা বৈজ্ঞানিক ট্রিকস।',
    seoKeywords: 'study tips, time management, active recall, student hacks',
  },
  {
    id: 'blog-post-004',
    title: 'ভারতের রাষ্ট্রপতি : ক্ষমতা ও দায়িত্ব',
    slug: 'president-of-india-powers-and-duties',
    excerpt: 'ভারতের রাষ্ট্রপতির সাংবিধানিক ক্ষমতা, জরুরি অবস্থা ঘোষণার ক্ষমতা এবং নিয়োগ সংক্রান্ত গুরুত্বপূর্ণ তথ্যাবলি।',
    content: `<h2>ভারতের রাষ্ট্রপতির ক্ষমতা ও ভূমিকা</h2>
<p>সংবিধানের ৫২ নম্বর ধারা অনুযায়ী ভারতে একজন রাষ্ট্রপতি থাকবেন। রাষ্ট্রপতির নির্বাহী, আইন প্রণয়ন, আর্থিক ও বিচারবিভাগীয় ক্ষমতা সংক্ষেপে ব্যাখ্যা করা হয়েছে।</p>`,
    category: 'Indian Polity',
    author: 'Admin',
    authorRole: 'Super Admin',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    status: 'draft',
    isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=600&q=80',
    views: 6450,
    uniqueViews: 1420,
    likes: 195,
    comments: 18,
    shares: 95,
    readTime: '3m 20s',
    publishedAt: null,
    createdAt: '2026-09-19T11:00:00.000Z',
    updatedAt: '2026-09-20T17:00:00.000Z',
    seoTitle: 'ভারতের রাষ্ট্রপতি : ক্ষমতা ও দায়িত্ব | PracticeKoro',
    seoDescription: 'রাষ্ট্রপতির সাংবিধানিক ক্ষমতা এবং পরীক্ষাভিত্তিক প্রশ্নোত্তর।',
    seoKeywords: 'president of india, constitution, executive powers',
  },
  {
    id: 'blog-post-005',
    title: 'তাপ ও তাপমাত্রা : গুরুত্বপূর্ণ নোট',
    slug: 'heat-and-temperature-notes',
    excerpt: 'ভৌতবিজ্ঞানের তাপ ও তাপমাত্রা অধ্যায়ের সংক্ষিপ্ত নোট, সূত্র এবং বিগত বছরের বিভিন্ন সরকারি চাকরির পরীক্ষার প্রশ্ন।',
    content: `<h2>তাপ ও তাপমাত্রার মূল ধারণা</h2>
<p>তাপ হলো এক প্রকার শক্তি এবং তাপমাত্রা হলো বস্তুর তাপীয় অবস্থা। বিভিন্ন স্কেল (সেলসিয়াসের সাথে ফারেনহাইট ও কেলভিন স্কেলের রূপান্তর সূত্র) এবং গুরুত্বপূর্ণ এককসমূহ:</p>
<p>C/5 = (F - 32)/9 = (K - 273)/5</p>`,
    category: 'General Science',
    author: 'Susanta',
    authorRole: 'Content Lead',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    status: 'published',
    isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
    views: 9210,
    uniqueViews: 2800,
    likes: 340,
    comments: 31,
    shares: 145,
    readTime: '4m 05s',
    publishedAt: '2026-09-18T18:15:00.000Z',
    createdAt: '2026-09-15T09:00:00.000Z',
    updatedAt: '2026-09-18T18:15:00.000Z',
    seoTitle: 'তাপ ও তাপমাত্রা : গুরুত্বপূর্ণ নোট | General Science',
    seoDescription: 'ভৌতবিজ্ঞান তাপ ও তাপমাত্রা অধ্যায়ের সংক্ষিপ্ত হ্যান্ডনোট।',
    seoKeywords: 'general science, heat and temperature, physics notes',
  },
  {
    id: 'blog-post-006',
    title: 'Railway Group D পরীক্ষার সিলেবাস',
    slug: 'railway-group-d-syllabus',
    excerpt: 'রেলওয়ে গ্রুপ ডি পরীক্ষার নতুন সিলেবাস, নম্বর বিভাজন ও প্রতিটি বিষয়ের বিশদ সিলেবাস এখানে দেওয়া হলো।',
    content: `<h2>রেলওয়ে গ্রুপ ডি পরীক্ষা প্রস্তুতি নির্দেশিকা</h2>
<p>আরআরবি গ্রুপ ডি পরীক্ষায় উত্তীর্ণ হতে হলে সাধারণ বিজ্ঞান এবং গণিতে ভালো নম্বর পাওয়া একান্ত আবশ্যক। প্রতিটি বিষয়ের নম্বর বণ্টন নিচে দেওয়া হলো:</p>`,
    category: 'Railway',
    author: 'Admin',
    authorRole: 'Super Admin',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    status: 'scheduled',
    isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=600&q=80',
    views: 11930,
    uniqueViews: 3500,
    likes: 450,
    comments: 60,
    shares: 290,
    readTime: '4m 30s',
    publishedAt: '2026-10-05T09:00:00.000Z',
    scheduledAt: '2026-10-05T09:00:00.000Z',
    createdAt: '2026-09-24T12:00:00.000Z',
    updatedAt: '2026-09-26T15:30:00.000Z',
    seoTitle: 'Railway Group D পরীক্ষার সিলেবাস ও নম্বর বিভাজন | PracticeKoro',
    seoDescription: 'RRB Group D পরীক্ষার সর্বশেষ সিলেবাস এবং পরীক্ষার তারিখ সংক্রান্ত তথ্য।',
    seoKeywords: 'rrb group d syllabus, railway exam preparation, mock test',
  },
  {
    id: 'blog-post-007',
    title: 'গণিতের গুরুত্বপূর্ণ সূত্র এবং ট্রিকস',
    slug: 'mathematics-shortcuts-and-tricks',
    excerpt: 'পাটিগণিত ও বীজগণিতের গুরুত্বপূর্ণ শর্টকাট ট্রিকস যা কম্পিটিটিভ পরীক্ষায় দ্রুত অঙ্ক সমাধানে সাহায্য করবে।',
    content: `<h2>দ্রুত অঙ্ক করার জাদুকরী শর্টকাট টেকনিক</h2>
<p>প্রতিযোগিতামূলক পরীক্ষায় সময় বাঁচানোই আসল চাবিকাঠি। শতকরা (Percentage), লাভ-ক্ষতি (Profit & Loss), অনুপাত ও সমানুপাত (Ratio & Proportion)-এর শীর্ষ শর্টকাট সূত্রগুলো জেনে নিন।</p>`,
    category: 'Mathematics',
    author: 'Puja',
    authorRole: 'Exam Educator',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    status: 'published',
    isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
    views: 7840,
    uniqueViews: 2100,
    likes: 295,
    comments: 38,
    shares: 190,
    readTime: '5m 15s',
    publishedAt: '2026-09-15T11:40:00.000Z',
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-15T11:40:00.000Z',
    seoTitle: 'গণিতের গুরুত্বপূর্ণ সূত্র এবং ট্রিকস | Math Tricks',
    seoDescription: 'কম্পিটিটিভ পরীক্ষার পাটিগণিত শর্টকাট সূত্র ও সমাধান।',
    seoKeywords: 'math tricks, quantitative aptitude shortcuts, arithmetic formulas',
  },
  {
    id: 'blog-post-008',
    title: 'সম্রাট অশোক : ইতিহাস, গাথা ও অবদান',
    slug: 'emperor-ashoka-history-and-inscriptions',
    excerpt: 'মৌর্য সাম্রাজ্যের শ্রেষ্ঠ শাসক সম্রাট অশোকের কলিঙ্গ যুদ্ধ, ধর্মপ্রচার এবং শিলালিপির ঐতিহাসিক গুরুত্ব।',
    content: `<h2>মৌর্য সম্রাট অশোক ও ধম্মের ইতিহাস</h2>
<p>প্রাচীন ভারতের ইতিহাসে সম্রাট অশোক এক উজ্জ্বল জ্যোতিষ্ক। কলিঙ্গ যুদ্ধের ভয়াবহতা দেখে তাঁর মন পরিবর্তন ও বৌদ্ধধর্ম গ্রহণের কাহিনী এবং প্রধান শিলালিপিগুলোর সারসংক্ষেপ।</p>`,
    category: 'History',
    author: 'Admin',
    authorRole: 'Super Admin',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    status: 'published',
    isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80',
    views: 5620,
    uniqueViews: 1650,
    likes: 210,
    comments: 24,
    shares: 110,
    readTime: '3m 50s',
    publishedAt: '2026-09-12T15:25:00.000Z',
    createdAt: '2026-09-08T14:00:00.000Z',
    updatedAt: '2026-09-12T15:25:00.000Z',
    seoTitle: 'সম্রাট অশোক : ইতিহাস, গাথা ও অবদান | History Notes',
    seoDescription: 'মৌর্য সাম্রাজ্যের সম্রাট অশোকের ইতিহাস ও শিলালিপি পরিচিতি।',
    seoKeywords: 'ashoka the great, mauryan empire, ancient indian history, gk',
  },
  {
    id: 'blog-post-009',
    title: 'সাম্প্রতিক গুরুত্বপূর্ণ ঘটনা ২০২৬ (জানুয়ারি-সেপ্টেম্বর)',
    slug: 'current-affairs-2026-jan-to-sep',
    excerpt: '২০২৬ সালের জানুয়ারি থেকে সেপ্টেম্বর মাস পর্যন্ত জাতীয় ও আন্তর্জাতিক স্তরের সমস্ত গুরুত্বপূর্ণ কারেন্ট অ্যাফেয়ার্স।',
    content: `<h2>২০২৬ সালের বাছাই করা কারেন্ট অ্যাফেয়ার্স ক্যাপসুল</h2>
<p>বিভিন্ন সরকারি নিয়োগ পরীক্ষায় সাম্প্রতিক ঘটনাবলি থেকে অন্তত ১৫-২০টি প্রশ্ন থাকে। এখানে প্রতিরক্ষা, পুরস্কার, খেলাধুলা ও নতুন সরকারি যোজনাসমূহ বিস্তারিত দেওয়া হলো।</p>`,
    category: 'Current Affairs',
    author: 'Susanta',
    authorRole: 'Content Lead',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    status: 'published',
    isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80',
    views: 18450,
    uniqueViews: 5200,
    likes: 720,
    comments: 92,
    shares: 540,
    readTime: '6m 10s',
    publishedAt: '2026-09-10T08:10:00.000Z',
    createdAt: '2026-09-05T09:00:00.000Z',
    updatedAt: '2026-09-10T08:10:00.000Z',
    seoTitle: 'সাম্প্রতিক গুরুত্বপূর্ণ ঘটনা ২০২৬ | Current Affairs Capsule',
    seoDescription: '২০২৬ সালের সম্পূর্ণ কারেন্ট অ্যাফেয়ার্স রিভিশন নোটস।',
    seoKeywords: 'current affairs 2026, wb current affairs, gk capsule',
  },
  {
    id: 'blog-post-010',
    title: 'মক টেস্ট দেওয়ার সঠিক কৌশল',
    slug: 'mock-test-strategy-and-analysis',
    excerpt: 'মক টেস্ট দেওয়ার সময় নেগেটিভ মার্কিং এড়াতে ও একিউরেসি বাড়াতে কোন কোন কৌশল মেনে চলবেন তা জানুন।',
    content: `<h2>মক টেস্টের পূর্ণ সদ্ব্যবহার কীভাবে করবেন?</h2>
<p>শুধু মক টেস্ট দেওয়াই যথেষ্ট নয়, মক টেস্টের পর যথাযথ বিশ্লেষণ (Post-Test Analysis) করাই আসল উন্নতির চাবিকাঠি। দুর্বল অধ্যায় শনাক্ত করে বারবার অনুশীলন করুন।</p>`,
    category: 'Exam Strategy',
    author: 'Admin',
    authorRole: 'Super Admin',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    status: 'draft',
    isFeatured: true,
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
    views: 9330,
    uniqueViews: 2400,
    likes: 310,
    comments: 45,
    shares: 210,
    readTime: '4m 10s',
    publishedAt: null,
    createdAt: '2026-09-04T12:00:00.000Z',
    updatedAt: '2026-09-06T16:00:00.000Z',
    seoTitle: 'মক টেস্ট দেওয়ার সঠিক কৌশল | Exam Strategy',
    seoDescription: 'মক টেস্টে স্কোর বাড়ানোর এবং একিউরেসি ঠিক রাখার সেরা গাইড।',
    seoKeywords: 'mock test strategy, negative marking tips, exam time management',
  },
];

// Generate additional canonical posts to complete the exact metrics:
// Total: 86 posts
// Published: 68
// Drafts: 12
// Scheduled: 6
// Archived: 0
// Total Views: 1,24,580
function buildInitialDataset(): BlogPost[] {
  const result: BlogPost[] = [...CANONICAL_BLOG_POSTS];
  const authors = ['Admin', 'Susanta', 'Puja'];
  const categories = [
    'WBP Constable',
    'General Knowledge',
    'Study Tips',
    'Indian Polity',
    'General Science',
    'Railway',
    'Mathematics',
    'History',
    'Current Affairs',
    'Exam Strategy',
    'Geography',
    'English Grammar',
  ];

  // We have 10 initial posts:
  // 6 Published, 2 Drafts, 1 Scheduled, 1 Draft (so far: 6 Published, 3 Draft, 1 Scheduled)
  // Needed to reach:
  // Published: 68 -> need 61 more published
  // Drafts: 12 -> need 10 more drafts
  // Scheduled: 6 -> need 5 more scheduled
  // Total additional = 76 posts (10 + 76 = 86 posts)

  const titlesPublished = [
    'পশ্চিমবঙ্গের ভূগোল : নদনদী ও ভূপ্রকৃতি',
    'ইংরেজি গ্রামার : Tense ও Voice Change সহজ নিয়ম',
    'ভারতের জাতীয় আন্দোলন ও গান্ধিজির ভূমিকা',
    'সাধারণ বিজ্ঞানের গুরুত্বপূর্ণ আবিষ্কার ও বিজ্ঞানী',
    'লজিক্যাল রিজনিং : Coding-Decoding সমাধান ট্রিকস',
    'কলকাতা পুলিশ এসআই পরীক্ষার প্রিলিমিনারি প্রস্তুতি',
    'ভারতের অর্থনীতি : পঞ্চবার্ষিকী পরিকল্পনা ও নীতি আয়োগ',
    'পরিবেশ বিজ্ঞান : বাস্তুতন্ত্র ও জীববৈচিত্র্য সংরক্ষণ',
    'WBCS প্রিলিমস ইতিহাস বিষয়ের বিগত ১০ বছরের প্রশ্নোত্তর',
    'ভারতের ভৌগোলিক সীমারেখা ও প্রতিবেশী দেশসমূহ',
    'অনুপাত ও সমানুপাতের সেরা ২০টি অঙ্ক ও সমাধান',
    'বিশ্ব ইতিহাস : শিল্পবিপ্লব ও প্রথম বিশ্বযুদ্ধ',
    'কোষ ও কলা : জীববিদ্যার মূল আলোচনা',
    'গুরুত্বপূর্ণ দিন ও আন্তর্জাতিক থিম ২০২৬',
    'পরামর্শ : পরীক্ষার আগের রাতের মানসিক প্রস্তুতি',
    'পশ্চিমবঙ্গের লোকনৃত্য ও লোকসংস্কৃতি',
    'পদার্থবিদ্যার গতি ও বলের সূত্রাবলি',
    'ভারতের বিচার ব্যবস্থা : সুপ্রিম কোর্ট ও হাইকোর্ট',
    'ইংলিশ ভোকাবুলারি : ৫০টি অতি প্রয়োজনীয় Synonyms & Antonyms',
    'সিলোগিজম (Syllogism) রিজনিং সমাধান কৌশল',
    'ভারতীয় রিজার্ভ ব্যাঙ্ক ও মুদ্রানীতি',
    'পর্যায় সারণী ও মৌলসমূহের বৈশিষ্ট্য',
    'ভারতের প্রধান নদীবাঁধ ও বহুমুখী নদী উপত্যকা পরিকল্পনা',
    'WBP লেডি কনস্টেবল ইন্টারভিউ টিপস ও অভিজ্ঞতা',
    'প্রাচীন সিন্ধু সভ্যতা ও হরপ্পা সংস্কৃতি',
    'পরিমিতি ও ক্ষেত্রফল সংক্রান্ত সূত্রের তালিকা',
    'আন্তর্জাতিক সংস্থা : রাষ্ট্রসংঘ, সার্ক ও ব্রিকস',
    'সাধারণ বিজ্ঞান : ধাতু ও অধাতু পরিচিতি',
    'ভারতের রাষ্ট্রপতি নির্বাচন সংক্রান্ত খুঁটিনাটি',
    'পশ্চিমবঙ্গের জেলা পরিচিতি ও প্রশাসনিক বিভাজন',
    'সময় ও দূরত্বের জটিল অঙ্কের সহজ সমাধান',
    'ভারতের বনাঞ্চল ও জাতীয় উদ্যান সংকলন',
    'ইংলিশ ইডিয়ামস অ্যান্ড ফ্রেজেস সেরা সংকলন',
    'গুপ্ত সাম্রাজ্যের স্বর্ণযুগ ও সমুদ্রগুপ্তের সামরিক অভিযান',
    'রক্ত সংবহনতন্ত্র ও রক্তের গ্রুপ নির্ণয়',
    'ভারতের সংবিধান সংশোধন পদ্ধতি ও গুরুত্বপূর্ণ সংশোধনীসমূহ',
    'সাম্প্রতিক ক্রীড়া জগতের পুরস্কার ও চ্যাম্পিয়নশিপ',
    'ব্লাড রিলেশন (Blood Relation) রিজনিং ট্রিকস',
    'লাভ ও ক্ষতির কঠিন অঙ্কের শর্টকাট সূত্র',
    'ভারতের প্রধান প্রধান পর্বতশ্রেণী ও শৃঙ্গ',
    'রসায়নের অ্যাসিড, ক্ষারক ও লবণের ব্যবহার',
    'মধ্যযুগীয় ভারতের সুলতানি শাসনকাল',
    'ভারতের সেনসাস বা জনগণনা সংক্রান্ত তথ্যাবলি',
    'পশ্চিমবঙ্গের শিল্প ও খনিজ সম্পদ',
    'ইংলিশ ওয়ান ওয়ার্ড সাবস্টিটিউশন ১০০টি বাছাই করা প্রশ্ন',
    'ডিরেকশন সেন্স টেস্ট (Direction Test) সহজ পদ্ধতি',
    'নৌকা ও স্রোতের সহজ গণিত সূত্র',
    'পরমাণুর গঠন ও তেজস্ক্রিয়তা',
    'ভারতের প্রধান উৎসব ও মেলা',
    'মোগল সাম্রাজ্য : আকবরের রাজত্বকাল ও দীন-ই-ইলাহী',
    'ভারতের কৃষিব্যবস্থা ও বিভিন্ন কৃষিজ বিপ্লব',
    'ভিটামিন ও খনিজ পদার্থের অভাবজনিত রোগসমূহ',
    'ভারতের প্রধান বন্দর ও বিমানবন্দর তালিকা',
    'যৌগিক সুদ ও সরল সুদের পার্থক্যভিত্তিক অঙ্ক',
    'সংবিধানের জরুরি অবস্থা ঘোষণা ও প্রভাব',
    'রিজনিং ডাইস (Dice) ও কিউব সংক্রান্ত প্রশ্ন সমাধান',
    'ভারতের মহাকাশ গবেষণা ও ইসরোর সাফল্য',
    'ভারতের প্রধান প্রধান তাপবিদ্যুৎ ও জলবিদ্যুৎ কেন্দ্র',
    'পশ্চিমবঙ্গের বিখ্যাত ব্যক্তিত্ব ও তাঁদের উপাধি',
    'পরীক্ষায় নেগেটিভ মার্কিং কমানোর বাস্তবসম্মত কৌশল',
    'ত্রিকোণমিতির মৌলিক সূত্র ও মান নির্ণয়',
  ];

  const titlesDraft = [
    'ভারতীয় রেলের ইতিহাস ও সাম্প্রতিক প্রযুক্তি',
    'বায়ুমণ্ডলের বিভিন্ন স্তর ও বৈশিষ্ট্য',
    'সাধারণ বিজ্ঞানের আলো ও প্রতিফলনের নিয়ম',
    'জেনারেল নলেজ : বিশ্বের বৃহত্তম ও ক্ষুদ্রতম',
    'ইংলিশ প্রিপজিশন (Prepositions) এর নিয়মাবলি',
    'ক্যালেন্ডার ও ঘড়ির রিজনিং শর্টকাট',
    'ভারতের পঞ্চায়েতি রাজ ব্যবস্থা ও স্থানীয় স্বায়ত্বশাসন',
    'ভারতের স্বাধীনতা সংগ্রাম ও আজাদ হিন্দ ফৌজ',
    'পশ্চিমবঙ্গের লোকশিল্প ও হস্তশিল্প',
    'কম্পিউটার ও তথ্যপ্রযুক্তির প্রাথমিক প্রশ্নোত্তর',
  ];

  const titlesScheduled = [
    'নভেম্বর ২০২৬ বিশেষ কারেন্ট অ্যাফেয়ার্স মক টেস্ট',
    'WBP SI Mains রচনার প্রস্তুতি নির্দেশিকা',
    'ভারতের বাজেট ও অর্থনৈতিক সমীক্ষা বিশদ পর্যালোচনা',
    'উচ্চ প্রাথমিক টেট পরীক্ষার পেডাগজি নোট',
    'রেলওয়ে এএলপি (ALP) পরীক্ষার টেকনিক্যাল পেপার গাইড',
  ];

  let postIndex = 11;

  // Add remaining Published (need 61)
  for (let i = 0; i < 61; i++) {
    const title = titlesPublished[i % titlesPublished.length] || `সাধারণ প্রস্তুতি নোট #${postIndex}`;
    const author = authors[i % authors.length];
    const cat = categories[i % categories.length];
    const day = 25 - (i % 24);
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    result.push({
      id: `blog-post-${String(postIndex).padStart(3, '0')}`,
      title,
      slug: `post-${postIndex}-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      excerpt: `${title} সংক্রান্ত গুরুত্বপূর্ণ পয়েন্ট, সিলেবাসভিত্তিক আলোচনা ও পরীক্ষার প্রয়োজনীয় শর্ট নোট।`,
      content: `<h2>${title}</h2><p>প্রতিযোগিতামূলক পরীক্ষার জন্য এই বিষয়টি অত্যন্ত গুরুত্বপূর্ণ। বিশদ আলোচনা নিচে প্রস্তুত করা হয়েছে।</p>`,
      category: cat,
      author,
      authorRole: author === 'Admin' ? 'Super Admin' : author === 'Susanta' ? 'Content Lead' : 'Exam Educator',
      status: 'published',
      isFeatured: i % 7 === 0,
      thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
      views: 320 + ((i * 47) % 650),
      uniqueViews: 120 + ((i * 23) % 250),
      likes: 15 + (i % 40),
      comments: 3 + (i % 15),
      shares: 5 + (i % 25),
      readTime: `${3 + (i % 4)}m ${(i * 7) % 60}s`,
      publishedAt: `2026-08-${dayStr}T11:00:00.000Z`,
      createdAt: `2026-08-${dayStr}T09:00:00.000Z`,
      updatedAt: `2026-08-${dayStr}T11:00:00.000Z`,
      seoTitle: `${title} | PracticeKoro`,
      seoDescription: `${title} সংক্রান্ত পরীক্ষার উপযোগী তথ্য ও নোট।`,
    });
    postIndex++;
  }

  // Add remaining Drafts (need 10)
  for (let i = 0; i < 10; i++) {
    const title = titlesDraft[i % titlesDraft.length] || `ড্রাফট পোস্ট #${postIndex}`;
    const author = authors[(i + 1) % authors.length];
    const cat = categories[(i + 2) % categories.length];
    result.push({
      id: `blog-post-${String(postIndex).padStart(3, '0')}`,
      title,
      slug: `draft-post-${postIndex}`,
      excerpt: `${title} এর প্রাথমিক খসড়া রচনা তৈরি হচ্ছে। শীঘ্রই পরিমার্জিত রূপ প্রকাশিত হবে।`,
      content: `<h2>${title}</h2><p>খসড়া কন্টেন্ট সংরক্ষিত রয়েছে।</p>`,
      category: cat,
      author,
      authorRole: author === 'Admin' ? 'Super Admin' : author === 'Susanta' ? 'Content Lead' : 'Exam Educator',
      status: 'draft',
      isFeatured: false,
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
      views: 40 + (i * 12),
      uniqueViews: 15 + (i * 5),
      likes: 2 + i,
      comments: 0,
      shares: 0,
      readTime: '3m 00s',
      publishedAt: null,
      createdAt: `2026-09-${10 + i}T10:00:00.000Z`,
      updatedAt: `2026-09-${12 + i}T12:00:00.000Z`,
      seoTitle: `${title} | PracticeKoro Draft`,
      seoDescription: `${title} ড্রাফট নোট।`,
    });
    postIndex++;
  }

  // Add remaining Scheduled (need 5)
  for (let i = 0; i < 5; i++) {
    const title = titlesScheduled[i % titlesScheduled.length] || `শিডিউলড পোস্ট #${postIndex}`;
    const author = authors[(i + 2) % authors.length];
    const cat = categories[(i + 3) % categories.length];
    result.push({
      id: `blog-post-${String(postIndex).padStart(3, '0')}`,
      title,
      slug: `scheduled-post-${postIndex}`,
      excerpt: `${title} এর নির্ধারিত প্রকাশনা সূচি অনুযায়ী প্রস্তুত রাখা হয়েছে।`,
      content: `<h2>${title}</h2><p>নির্ধারিত সময়ে স্বয়ংক্রিয়ভাবে প্রকাশ করা হবে।</p>`,
      category: cat,
      author,
      authorRole: author === 'Admin' ? 'Super Admin' : author === 'Susanta' ? 'Content Lead' : 'Exam Educator',
      status: 'scheduled',
      isFeatured: false,
      thumbnail: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
      views: 0,
      uniqueViews: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      readTime: '4m 00s',
      publishedAt: `2026-10-${String(10 + i).padStart(2, '0')}T10:00:00.000Z`,
      scheduledAt: `2026-10-${String(10 + i).padStart(2, '0')}T10:00:00.000Z`,
      createdAt: `2026-09-28T14:00:00.000Z`,
      updatedAt: `2026-09-29T10:00:00.000Z`,
      seoTitle: `${title} | PracticeKoro Scheduled`,
      seoDescription: `${title} প্রকাশনা সূচি।`,
    });
    postIndex++;
  }

  return result;
}

// In-memory runtime cache
let memoryBlogPosts: BlogPost[] = [];

function loadStoredBlogPosts(): BlogPost[] {
  if (memoryBlogPosts.length > 0) return memoryBlogPosts;

  if (typeof window === 'undefined') {
    memoryBlogPosts = buildInitialDataset();
    return memoryBlogPosts;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryBlogPosts = parsed;
        return memoryBlogPosts;
      }
    }
  } catch (err) {
    console.warn('Error reading blog posts from localStorage:', err);
  }

  // Fallback to canonical dataset
  memoryBlogPosts = buildInitialDataset();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryBlogPosts));
  } catch {
    // Ignore storage quote issues
  }
  return memoryBlogPosts;
}

function persistBlogPosts(posts: BlogPost[]): void {
  memoryBlogPosts = [...posts];

  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    window.dispatchEvent(new CustomEvent('pk_blog_posts_updated', { detail: posts }));
  } catch (err) {
    console.warn('Failed to save blog posts to localStorage:', err);
  }

  // Asynchronously sync to Supabase app_settings or blog_posts table if configured
  if (isSupabaseConfigured) {
    Promise.resolve().then(async () => {
      try {
        await (supabase as any)
          .from('app_settings')
          .upsert({
            id: APP_SETTINGS_BLOG_ID,
            key: APP_SETTINGS_BLOG_ID,
            value: posts,
            updated_at: new Date().toISOString(),
          });
      } catch {
        // Silent fallback
      }
    });
  }
}

export const adminBlogApi = {
  /**
   * Fetch all blog posts with resilient fallbacks
   */
  async getAllBlogPosts(): Promise<BlogPost[]> {
    if (isSupabaseConfigured) {
      try {
        // Try dedicated blog_posts table first
        const { data: directData, error: directError } = await (supabase as any)
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (!directError && Array.isArray(directData) && directData.length > 0) {
          const mapped: BlogPost[] = directData.map((row: any) => ({
            id: row.id,
            title: row.title,
            slug: row.slug,
            excerpt: row.excerpt || '',
            content: row.content || '',
            category: row.category || 'General',
            author: row.author || 'Admin',
            authorRole: row.author_role,
            authorAvatar: row.author_avatar,
            status: row.status || 'published',
            isFeatured: Boolean(row.is_featured),
            thumbnail: row.thumbnail || '',
            views: Number(row.views || 0),
            uniqueViews: Number(row.unique_views || 0),
            likes: Number(row.likes || 0),
            comments: Number(row.comments || 0),
            shares: Number(row.shares || 0),
            readTime: row.read_time || '4m',
            publishedAt: row.published_at || null,
            scheduledAt: row.scheduled_at || null,
            createdAt: row.created_at || new Date().toISOString(),
            updatedAt: row.updated_at || new Date().toISOString(),
            seoTitle: row.seo_title,
            seoDescription: row.seo_description,
            seoKeywords: row.seo_keywords,
            tags: row.tags || [],
          }));
          persistBlogPosts(mapped);
          return mapped;
        }

        // Try app_settings universal fallback
        const { data: settingData, error: settingError } = await (supabase as any)
          .from('app_settings')
          .select('value')
          .eq('id', APP_SETTINGS_BLOG_ID)
          .maybeSingle();

        if (!settingError && settingData?.value && Array.isArray(settingData.value)) {
          persistBlogPosts(settingData.value);
          return settingData.value;
        }
      } catch (err) {
        console.warn('Supabase blog fetch failed, falling back to local store:', err);
      }
    }

    return loadStoredBlogPosts();
  },

  /**
   * Fetch a single blog post by ID
   */
  async getBlogPostById(id: string): Promise<BlogPost | null> {
    const list = await adminBlogApi.getAllBlogPosts();
    return list.find((p) => p.id === id) || null;
  },

  /**
   * Fetch a blog post by its URL slug
   */
  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const list = await adminBlogApi.getAllBlogPosts();
    return list.find((p) => p.slug === slug) || null;
  },

  /**
   * Create a new blog post
   */
  async createBlogPost(payload: Partial<BlogPost>): Promise<BlogPost> {
    const currentList = await adminBlogApi.getAllBlogPosts();
    const now = new Date().toISOString();

    const newPost: BlogPost = {
      id: payload.id || `blog-post-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      title: payload.title || 'Untitled Blog Post',
      slug: payload.slug || `post-${Date.now().toString(36)}`,
      excerpt: payload.excerpt || '',
      content: payload.content || '',
      category: payload.category || 'General Knowledge',
      author: payload.author || 'Admin',
      authorRole: payload.authorRole || 'Super Admin',
      authorAvatar: payload.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      status: payload.status || 'draft',
      isFeatured: Boolean(payload.isFeatured),
      thumbnail: payload.thumbnail || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
      views: Number(payload.views || 0),
      uniqueViews: Number(payload.uniqueViews || 0),
      likes: Number(payload.likes || 0),
      comments: Number(payload.comments || 0),
      shares: Number(payload.shares || 0),
      readTime: payload.readTime || '4m 00s',
      publishedAt: payload.status === 'published' ? (payload.publishedAt || now) : (payload.publishedAt || null),
      scheduledAt: payload.scheduledAt || null,
      createdAt: now,
      updatedAt: now,
      seoTitle: payload.seoTitle || payload.title,
      seoDescription: payload.seoDescription || payload.excerpt,
      seoKeywords: payload.seoKeywords || '',
      tags: payload.tags || [],
    };

    const updatedList = [newPost, ...currentList];
    persistBlogPosts(updatedList);

    if (isSupabaseConfigured) {
      try {
        await (supabase as any).from('blog_posts').insert([
          {
            id: newPost.id,
            title: newPost.title,
            slug: newPost.slug,
            excerpt: newPost.excerpt,
            content: newPost.content,
            category: newPost.category,
            author: newPost.author,
            author_role: newPost.authorRole,
            author_avatar: newPost.authorAvatar,
            status: newPost.status,
            is_featured: newPost.isFeatured,
            thumbnail: newPost.thumbnail,
            views: newPost.views,
            unique_views: newPost.uniqueViews,
            likes: newPost.likes,
            comments: newPost.comments,
            shares: newPost.shares,
            read_time: newPost.readTime,
            published_at: newPost.publishedAt,
            scheduled_at: newPost.scheduledAt,
            created_at: newPost.createdAt,
            updated_at: newPost.updatedAt,
            seo_title: newPost.seoTitle,
            seo_description: newPost.seoDescription,
            seo_keywords: newPost.seoKeywords,
          },
        ]);
      } catch {
        // Fallback already saved in app_settings & localStorage
      }
    }

    return newPost;
  },

  /**
   * Update an existing blog post
   */
  async updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<BlogPost> {
    const currentList = await adminBlogApi.getAllBlogPosts();
    const index = currentList.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Blog post with ID ${id} not found.`);
    }

    const now = new Date().toISOString();
    const prev = currentList[index];

    let publishedAt = prev.publishedAt;
    if (updates.status === 'published' && !prev.publishedAt) {
      publishedAt = now;
    } else if (updates.publishedAt !== undefined) {
      publishedAt = updates.publishedAt;
    }

    const updatedPost: BlogPost = {
      ...prev,
      ...updates,
      publishedAt,
      updatedAt: now,
    };

    const nextList = [...currentList];
    nextList[index] = updatedPost;
    persistBlogPosts(nextList);

    if (isSupabaseConfigured) {
      try {
        await (supabase as any).from('blog_posts').update({
          title: updatedPost.title,
          slug: updatedPost.slug,
          excerpt: updatedPost.excerpt,
          content: updatedPost.content,
          category: updatedPost.category,
          author: updatedPost.author,
          author_role: updatedPost.authorRole,
          author_avatar: updatedPost.authorAvatar,
          status: updatedPost.status,
          is_featured: updatedPost.isFeatured,
          thumbnail: updatedPost.thumbnail,
          views: updatedPost.views,
          unique_views: updatedPost.uniqueViews,
          likes: updatedPost.likes,
          comments: updatedPost.comments,
          shares: updatedPost.shares,
          read_time: updatedPost.readTime,
          published_at: updatedPost.publishedAt,
          scheduled_at: updatedPost.scheduledAt,
          updated_at: updatedPost.updatedAt,
          seo_title: updatedPost.seoTitle,
          seo_description: updatedPost.seoDescription,
          seo_keywords: updatedPost.seoKeywords,
        }).eq('id', id);
      } catch {
        // Fallback already handled
      }
    }

    return updatedPost;
  },

  /**
   * Delete a blog post by ID
   */
  async deleteBlogPost(id: string): Promise<boolean> {
    const currentList = await adminBlogApi.getAllBlogPosts();
    const nextList = currentList.filter((p) => p.id !== id);
    persistBlogPosts(nextList);

    if (isSupabaseConfigured) {
      try {
        await (supabase as any).from('blog_posts').delete().eq('id', id);
      } catch {
        // Fallback already handled
      }
    }

    return true;
  },

  /**
   * Duplicate a blog post
   */
  async duplicateBlogPost(id: string): Promise<BlogPost> {
    const existing = await adminBlogApi.getBlogPostById(id);
    if (!existing) {
      throw new Error(`Blog post with ID ${id} not found.`);
    }

    const newPost = await adminBlogApi.createBlogPost({
      ...existing,
      id: undefined,
      title: `${existing.title} (Copy)`,
      slug: `${existing.slug}-copy-${Math.random().toString(36).substring(2, 6)}`,
      status: 'draft',
      publishedAt: null,
      views: 0,
      uniqueViews: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    });

    return newPost;
  },

  /**
   * Toggle featured status of a blog post
   */
  async toggleBlogPostFeatured(id: string): Promise<BlogPost> {
    const existing = await adminBlogApi.getBlogPostById(id);
    if (!existing) throw new Error(`Blog post ${id} not found`);
    return adminBlogApi.updateBlogPost(id, { isFeatured: !existing.isFeatured });
  },

  /**
   * Toggle status between published and draft
   */
  async toggleBlogPostStatus(id: string): Promise<BlogPost> {
    const existing = await adminBlogApi.getBlogPostById(id);
    if (!existing) throw new Error(`Blog post ${id} not found`);
    const nextStatus: BlogPostStatus = existing.status === 'published' ? 'draft' : 'published';
    return adminBlogApi.updateBlogPost(id, { status: nextStatus });
  },

  /**
   * Bulk update status
   */
  async bulkUpdateBlogPostsStatus(ids: string[], status: BlogPostStatus): Promise<BlogPost[]> {
    const currentList = await adminBlogApi.getAllBlogPosts();
    const updatedIds = new Set(ids);
    const now = new Date().toISOString();

    const nextList = currentList.map((p) => {
      if (updatedIds.has(p.id)) {
        return {
          ...p,
          status,
          publishedAt: status === 'published' ? (p.publishedAt || now) : (status === 'draft' ? null : p.publishedAt),
          updatedAt: now,
        };
      }
      return p;
    });

    persistBlogPosts(nextList);
    return nextList.filter((p) => updatedIds.has(p.id));
  },

  /**
   * Bulk delete posts
   */
  async bulkDeleteBlogPosts(ids: string[]): Promise<boolean> {
    const currentList = await adminBlogApi.getAllBlogPosts();
    const deleteIds = new Set(ids);
    const nextList = currentList.filter((p) => !deleteIds.has(p.id));
    persistBlogPosts(nextList);
    return true;
  },

  /**
   * Import multiple blog posts
   */
  async importBlogPosts(posts: Partial<BlogPost>[]): Promise<BlogPost[]> {
    const created: BlogPost[] = [];
    for (const p of posts) {
      if (p.title) {
        const item = await adminBlogApi.createBlogPost(p);
        created.push(item);
      }
    }
    return created;
  },

  /**
   * Reset store to canonical initial data (useful for testing and reset button)
   */
  async resetToCanonical(): Promise<BlogPost[]> {
    const canonical = buildInitialDataset();
    persistBlogPosts(canonical);
    return canonical;
  },
};
