import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/services/api';
import {
  Shield,
  BookOpen,
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  MoreVertical,
  AlertTriangle,
  Shuffle,
  Check,
  Copy,
  RefreshCw,
} from 'lucide-react';
import type { Question, Exam, Subject, Chapter } from '@/types';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import { isSupabaseConfigured } from '@/lib/supabase';

export type UploadMode = 'exam' | 'subject';
export type QuestionBankStatus = 'published' | 'draft' | 'under_review' | 'archived';

// Full showcase dataset matching reference screenshot media_1791132993733.jpg
// Rows 1-10 are pixel-exact matches to the reference screenshot; rows 11-40 populate pages 2-4+
const INITIAL_DEMO_QUESTIONS: Question[] = [
  // --- PAGE 1 (Rows 1 to 10 matching media_1791132993733.jpg exactly) ---
  {
    id: '10421',
    questionText: 'Who was the first Governor-General of India?',
    questionBengaliText: 'ভারতের প্রথম গভর্নর-জেনারেল কে ছিলেন?',
    optionA: 'Warren Hastings',
    optionB: 'Lord Cornwallis',
    optionC: 'Lord Wellesley',
    optionD: 'Lord Canning',
    correctOption: 'A',
    uploadMode: 'exam',
    sourceExam: 'WBP Constable',
    subjectName: 'History',
    topicName: 'Modern India',
    chapterName: 'Modern India',
    questionType: 'PYQ',
    sourceType: 'pyq',
    sourceYear: 2025,
    sourcePaper: 'Set A',
    section: 'General Awareness',
    explanation:
      'Warren Hastings served as the first Governor-General of Bengal (1773–1785) following the Regulating Act of 1773.',
    explanationBengali:
      'ওয়ারেন হেস্টিংস ১৭৭৩ সালের রেগুলেটিং অ্যাক্টের মাধ্যমে বাংলার প্রথম গভর্নর-জেনারেল হিসেবে নিযুক্ত হন।',
    shortNotes:
      '• ১৭৭৩: রেগুলেটিং অ্যাক্ট পাস হয়\n• ওয়ারেন হেস্টিংস প্রথম গভর্নর-জেনারেল\n• দ্বৈত শাসন ব্যবস্থার অবসান ঘটান\n• এশিয়াটিক সোসাইটি অব বেঙ্গল (১৭৮৪) তাঁর আমলে প্রতিষ্ঠিত হয়',
    tags: ['WBP', 'Modern India', 'Governor General'],
    status: 'published',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
    versionHistory: [
      {
        version: 1,
        editedBy: 'Super Admin',
        editedAt: '2026-09-12 14:20',
        changes: 'Created official 2025 PYQ question',
      },
      {
        version: 2,
        editedBy: 'Super Admin',
        editedAt: '2026-09-15 11:05',
        changes: 'Added short notes and verified Bengali translation',
      },
    ],
  },
  {
    id: '10420',
    questionText: 'What is the chemical name of H2O?',
    questionBengaliText: 'H₂O এর রাসায়নিক নাম কি?',
    optionA: 'Hydrogen Peroxide',
    optionB: 'Dihydrogen Monoxide',
    optionC: 'Hydrogen Dioxide',
    optionD: 'Hydroxide Ion',
    correctOption: 'B',
    uploadMode: 'subject',
    subjectName: 'General Science',
    topicName: 'Chemical Reactions',
    chapterName: 'Chemical Reactions',
    questionType: 'Topic',
    sourceType: 'topic',
    explanation: 'The IUPAC systematic chemical name for water (H2O) is Dihydrogen Monoxide.',
    explanationBengali:
      'জলের (H₂O) রাসায়নিক বা আইইউপিএসি নাম হলো ডাইহাইড্রোজেন মনোক্সাইড (Dihydrogen Monoxide)।',
    shortNotes:
      '• রাসায়নিক সংকেত: H₂O\n• মোলার ভর: ১৮.০১৫ গ্রাম/মোল\n• হাইড্রোজেন ও অক্সিজেনের অনুপাত: ২:১\n• হাইড্রোজেন বন্ধনের কারণে উচ্চ স্ফুটনাঙ্ক',
    tags: ['Chemistry', 'General Science', 'Molecules'],
    status: 'published',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
  {
    id: '10419',
    questionText: 'Who is known as the chief architect of the Indian Constitution?',
    questionBengaliText: 'ভারতের সংবিধান প্রণেতা কাকে বলা হয়?',
    optionA: 'Dr. B. R. Ambedkar',
    optionB: 'Dr. Rajendra Prasad',
    optionC: 'Jawaharlal Nehru',
    optionD: 'Sardar Vallabhbhai Patel',
    correctOption: 'A',
    uploadMode: 'subject',
    subjectName: 'Indian Polity',
    topicName: 'Constitution',
    chapterName: 'Constitution',
    questionType: 'Topic',
    sourceType: 'topic',
    explanation:
      'Dr. Bhimrao Ramji Ambedkar was the Chairman of the Drafting Committee of the Constituent Assembly.',
    explanationBengali:
      'ডঃ বি. আর. আম্বেদকর খসড়া কমিটির (Drafting Committee) সভাপতি ছিলেন এবং তাঁকে ভারতীয় সংবিধানের প্রধান স্থপতি বলা হয়।',
    shortNotes:
      '• ২৯ আগস্ট ১৯৪৭: ড্রাফটিং কমিটি গঠিত হয়\n• মোট সদস্য: ৭ জন\n• ২৬ নভেম্বর ১৯৪৯: সংবিধান গৃহীত হয়\n• ২৬ জানুয়ারি ১৯৫০: কার্যকর হয়',
    tags: ['Polity', 'Constitution', 'Ambedkar'],
    status: 'published',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
  {
    id: '10418',
    questionText: 'What is the value of 2 + 3 * 4?',
    questionBengaliText: '২ + ৩ × ৪ = ?',
    optionA: '20',
    optionB: '14',
    optionC: '24',
    optionD: '12',
    correctOption: 'B',
    uploadMode: 'subject',
    subjectName: 'Mathematics',
    topicName: 'BODMAS',
    chapterName: 'BODMAS',
    questionType: 'Topic',
    sourceType: 'topic',
    explanation:
      'Following the BODMAS rule: Multiplication comes before addition. 3 * 4 = 12, then 2 + 12 = 14.',
    explanationBengali:
      'BODMAS নিয়ম অনুযায়ী প্রথমে গুণ করতে হবে: ৩ × ৪ = ১২, তারপর যোগ: ২ + ১২ = ১৪।',
    shortNotes:
      '• B: Brackets\n• O: Orders / Of\n• D: Division\n• M: Multiplication\n• A: Addition\n• S: Subtraction',
    tags: ['Maths', 'Arithmetic', 'BODMAS'],
    status: 'published',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
  {
    id: '10417',
    questionText: 'In which time period did the Indigo Revolt begin?',
    questionBengaliText: 'নীল চাষ কোন সময়কালে শুরু হয়?',
    optionA: '1859 - 1860',
    optionB: '1857 - 1858',
    optionC: '1885 - 1886',
    optionD: '1905 - 1906',
    correctOption: 'A',
    uploadMode: 'exam',
    sourceExam: 'WBP Constable',
    subjectName: 'History',
    topicName: 'Modern India',
    chapterName: 'Modern India',
    questionType: 'PYQ',
    sourceType: 'pyq',
    sourceYear: 2024,
    sourcePaper: 'Set B',
    explanation:
      'The Indigo Revolt (Nil Vidroha) began in Bengal in 1859-1860 led by Bishnucharan Biswas and Digambar Biswas.',
    explanationBengali:
      '১৮৫৯-১৮৬০ সালে বাংলায় বিষ্ণুচরণ বিশ্বাস ও দিগম্বর বিশ্বাসের নেতৃত্বে নীল বিদ্রোহ শুরু হয়।',
    shortNotes:
      '• কেন্দ্র: নদীয়া জেলার চৌগাছা গ্রাম\n• নেতা: দিগম্বর বিশ্বাস ও বিষ্ণুচরণ বিশ্বাস\n• দীনবন্ধু মিত্রের নাটক: নীলদর্পণ (১৮৬০)\n• হরিশচন্দ্র মুখোপাধ্যায়ের পত্রিকা: হিন্দু প্যাট্রিয়ট',
    tags: ['WBP', 'Bengal History', 'Revolt'],
    status: 'under_review',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
  {
    id: '10416',
    questionText: 'Which is the longest river in India?',
    questionBengaliText: 'ভারতের বৃহত্তম নদী কোনটি?',
    optionA: 'Godavari',
    optionB: 'Ganga',
    optionC: 'Brahmaputra',
    optionD: 'Indus',
    correctOption: 'B',
    uploadMode: 'subject',
    subjectName: 'Geography',
    topicName: 'Rivers of India',
    chapterName: 'Rivers of India',
    questionType: 'Topic',
    sourceType: 'topic',
    explanation:
      'Ganga is the longest river flowing entirely within India with a length of 2,525 km.',
    explanationBengali: 'গঙ্গা ভারতের দীর্ঘতম নদী, যার মোট দৈর্ঘ্য প্রায় ২৫২৫ কিমি।',
    shortNotes:
      '• উৎপত্তি: গঙ্গোত্রী হিমবাহের গোমুখ গুহা\n• মোহনা: বঙ্গোপসাগর\n• ডান তীরের প্রধান উপনদী: যমুনা\n• বাম তীরের উপনদী: গোমতী, ঘর্ঘরা, গণ্ডক, কোশী',
    tags: ['Geography', 'Rivers', 'Ganga'],
    status: 'published',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
  {
    id: '10415',
    questionText: 'When was GST implemented in India?',
    questionBengaliText: 'GST কবে চালু হয়?',
    optionA: '1 July 2017',
    optionB: '1 April 2017',
    optionC: '1 January 2018',
    optionD: '8 November 2016',
    correctOption: 'A',
    uploadMode: 'exam',
    sourceExam: 'WBP Constable',
    subjectName: 'Economy',
    topicName: 'Indian Economy',
    chapterName: 'Indian Economy',
    questionType: 'PYQ',
    sourceType: 'pyq',
    sourceYear: 2023,
    sourcePaper: 'Preliminary',
    explanation:
      'The Goods and Services Tax (GST) came into effect in India on July 1, 2017 via the 101st Constitutional Amendment Act.',
    explanationBengali:
      '১০১তম সংবিধান সংশোধন আইনের মাধ্যমে ২০১৭ সালের ১লা জুলাই ভারতে পণ্য ও পরিষেবা কর (GST) চালু হয়।',
    shortNotes:
      '• ১লা জুলাই ২০১৭ থেকে কার্যকর\n• সংবিধানের ১০১তম সংশোধনী\n• ট্যাগলাইন: One Nation, One Tax\n• প্রথম রাজ্য হিসেবে পাস করে: আসাম',
    tags: ['WBP', 'GST', 'Indian Economy'],
    status: 'published',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
  {
    id: '10414',
    questionText: 'What is the capital of West Bengal?',
    questionBengaliText: 'পশ্চিমবঙ্গের রাজধানী কোনটি?',
    optionA: 'Siliguri',
    optionB: 'Kolkata',
    optionC: 'Howrah',
    optionD: 'Asansol',
    correctOption: 'B',
    uploadMode: 'subject',
    subjectName: 'General Knowledge',
    topicName: 'West Bengal',
    chapterName: 'West Bengal',
    questionType: 'Topic',
    sourceType: 'topic',
    explanation: 'Kolkata is the capital of the Indian state of West Bengal.',
    explanationBengali: 'কলকাতা হলো ভারতের পশ্চিমবঙ্গ রাজ্যের রাজধানী ও বৃহত্তম শহর।',
    shortNotes:
      '• হুগলী নদীর পূর্ব তীরে অবস্থিত\n• ভারতের সাংস্কৃতিক রাজধানী\n• জব চার্নক ১৬৯০ সালে প্রতিষ্ঠা করেন বলে বিবেচনা করা হতো',
    tags: ['GK', 'West Bengal', 'Kolkata'],
    status: 'draft',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
  {
    id: '10413',
    questionText: 'Which component in human blood transports oxygen?',
    questionBengaliText: 'মানুষের রক্তে কোন উপাদান অক্সিজেন পরিবহন করে?',
    optionA: 'Hemoglobin',
    optionB: 'Plasma',
    optionC: 'Platelets',
    optionD: 'White Blood Cells',
    correctOption: 'A',
    uploadMode: 'subject',
    subjectName: 'General Science',
    topicName: 'Human Body',
    chapterName: 'Human Body',
    questionType: 'Topic',
    sourceType: 'topic',
    explanation:
      'Hemoglobin is an iron-rich protein in red blood cells that carries oxygen from the lungs throughout the body.',
    explanationBengali:
      'লোহিত রক্তকণিকায় অবস্থিত হিমোগ্লোবিন নামক লৌহঘটিত প্রোটিন ফুসফুস থেকে সারা দেহে অক্সিজেন পরিবহন করে।',
    shortNotes:
      '• লোহিত রক্তকণিকায় (RBC) থাকে\n• একটি হিমোগ্লোবিন অণু ৪টি অক্সিজেন অণু বহন করতে পারে\n• হিমোগ্লোবিনের আয়ুষ্কাল প্রায় ১২০ দিন',
    tags: ['Biology', 'Blood', 'Human Body'],
    status: 'published',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
  {
    id: '10412',
    questionText: 'What is the national flower of India?',
    questionBengaliText: 'ভারতের জাতীয় ফুল কোনটি?',
    optionA: 'Rose',
    optionB: 'Lotus',
    optionC: 'Marigold',
    optionD: 'Jasmine',
    correctOption: 'B',
    uploadMode: 'exam',
    sourceExam: 'WBP Constable',
    subjectName: 'Static GK',
    topicName: 'National Symbols',
    chapterName: 'National Symbols',
    questionType: 'PYQ',
    sourceType: 'pyq',
    sourceYear: 2022,
    sourcePaper: 'Preliminary',
    explanation:
      'The Lotus (Nelumbo nucifera) is the national flower of India, representing spirituality, fruitfulness, and purity.',
    explanationBengali:
      'পদ্ম (Nelumbo nucifera) হলো ভারতের জাতীয় ফুল। এটি পবিত্রতা, সৌন্দর্য ও জ্ঞানের প্রতীক।',
    shortNotes: '• বৈজ্ঞানিক নাম: Nelumbo Nucifera\n• জলজ উদ্ভিদ\n• পবিত্রতা ও সমৃদ্ধির প্রতীক',
    tags: ['WBP', 'National Symbols', 'Static GK'],
    status: 'published',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },

  // --- PAGE 2 (Rows 11 to 20) ---
  {
    id: '10411',
    questionText: 'When did the Battle of Plassey take place?',
    questionBengaliText: 'পলাশীর যুদ্ধ কবে অনুষ্ঠিত হয়?',
    optionA: '23 June 1757',
    optionB: '22 October 1764',
    optionC: '15 August 1772',
    optionD: '10 May 1857',
    correctOption: 'A',
    uploadMode: 'exam',
    sourceExam: 'WBSSC Group C',
    subjectName: 'History',
    topicName: 'Modern India',
    chapterName: 'Modern India',
    questionType: 'PYQ',
    sourceType: 'pyq',
    sourceYear: 2024,
    sourcePaper: 'Shift 1',
    explanation:
      'The Battle of Plassey took place on 23 June 1757 between Siraj-ud-Daulah and the British East India Company led by Robert Clive.',
    explanationBengali:
      '১৭৫৭ সালের ২৩শে জুন রবার্ট ক্লাইভের নেতৃত্বাধীন ব্রিটিশ বাহিনী এবং নবাব সিরাজউদ্দৌলার মধ্যে পলাশীর যুদ্ধ সংঘটিত হয়।',
    shortNotes:
      '• স্থান: নদীয়া জেলার পলাশীর আমবাগান\n• প্রধান মীর বকশী মীর জাফর বিশ্বাসঘাতকতা করেন\n• ভারতে ব্রিটিশ সাম্রাজ্যের সূচনা',
    tags: ['History', 'Plassey', 'WBSSC'],
    status: 'published',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
  {
    id: '10410',
    questionText: 'Which Vitamin is synthesized in human body through sunlight exposure?',
    questionBengaliText: 'সূর্যালোকের সাহায্যে মানবদেহে কোন ভিটামিন সংশ্লেষিত হয়?',
    optionA: 'Vitamin A',
    optionB: 'Vitamin B12',
    optionC: 'Vitamin C',
    optionD: 'Vitamin D',
    correctOption: 'D',
    uploadMode: 'subject',
    subjectName: 'General Science',
    topicName: 'Human Body',
    chapterName: 'Human Body',
    questionType: 'Topic',
    sourceType: 'topic',
    explanation:
      'Vitamin D is produced in the skin when exposed to sunlight (UVB radiation). It is essential for bone health.',
    explanationBengali:
      'সূর্যালোকের অতিবেগুনি রশ্মির উপস্থিতিতে ত্বকে ভিটামিন ডি তৈরি হয়, যা হাড় ও দাঁত মজবুত রাখতে সাহায্য করে।',
    shortNotes:
      '• রাসায়নিক নাম: ক্যালসিফেরল (Calciferol)\n• অভাবজনিত রোগ: শিশুদের রিকেটস ও বয়স্কদের অস্টিওম্যালাশিয়া\n• চর্বিতে দ্রবণীয় ভিটামিন',
    tags: ['Science', 'Vitamins', 'Biology'],
    status: 'published',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
  {
    id: '10409',
    questionText: 'Under which Article of the Constitution can Financial Emergency be declared?',
    questionBengaliText: 'সংবিধানের কোন ধারায় আর্থিক জরুরি অবস্থা ঘোষণা করা যায়?',
    optionA: 'Article 352',
    optionB: 'Article 356',
    optionC: 'Article 360',
    optionD: 'Article 368',
    correctOption: 'C',
    uploadMode: 'subject',
    subjectName: 'Indian Polity',
    topicName: 'Constitution',
    chapterName: 'Constitution',
    questionType: 'Topic',
    sourceType: 'topic',
    explanation:
      'Article 360 empowers the President of India to declare a Financial Emergency if financial stability is threatened.',
    explanationBengali:
      'ভারতীয় সংবিধানের ৩৬০ নম্বর ধারা অনুযায়ী রাষ্ট্রপতি আর্থিক জরুরি অবস্থা ঘোষণা করতে পারেন (ভারতে এযাবৎ এটি জারি হয়নি)।',
    shortNotes:
      '• ৩৫২ ধারা: জাতীয় জরুরি অবস্থা\n• ৩৫৬ ধারা: রাজ্যে রাষ্ট্রপতি শাসন\n• ৩৬০ ধারা: আর্থিক জরুরি অবস্থা\n• ৩৬৮ ধারা: সংবিধান সংশোধন পদ্ধতি',
    tags: ['Polity', 'Emergency', 'Constitution'],
    status: 'published',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
  {
    id: '10408',
    questionText: 'If a sum doubles in 5 years at simple interest, what is the rate of interest?',
    questionBengaliText: 'সরল সুদে ৫ বছরে কোনো আসল দ্বিগুণ হলে বার্ষিক সুদের হার কত?',
    optionA: '10%',
    optionB: '15%',
    optionC: '20%',
    optionD: '25%',
    correctOption: 'C',
    uploadMode: 'subject',
    subjectName: 'Mathematics',
    topicName: 'BODMAS',
    chapterName: 'BODMAS',
    questionType: 'Topic',
    sourceType: 'topic',
    explanation:
      'If P doubles, Interest I = P. Time T = 5. Rate R = (100 * I) / (P * T) = (100 * P) / (P * 5) = 20%.',
    explanationBengali:
      'আসল P হলে সুদ I = P। সুতরাং সুদের হার R = (১০০ × I) / (P × T) = (১০০ × P) / (P × ৫) = ২০%।',
    shortNotes: '• সূত্র: I = (P × R × T) / 100\n• দ্বিগুণ হলে: R = 100 / T\n• এখানে: R = 100 / 5 = 20%',
    tags: ['Maths', 'Simple Interest', 'Arithmetic'],
    status: 'published',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
  {
    id: '10407',
    questionText: 'Which district of West Bengal has the lowest literacy rate according to 2011 census?',
    questionBengaliText: '২০১১ সালের জনগণনা অনুযায়ী পশ্চিমবঙ্গের সর্বনিম্ন সাক্ষরতার হারযুক্ত জেলা কোনটি?',
    optionA: 'Purulia',
    optionB: 'Uttar Dinajpur',
    optionC: 'Maldah',
    optionD: 'Murshidabad',
    correctOption: 'B',
    uploadMode: 'exam',
    sourceExam: 'WBP Constable',
    subjectName: 'Geography',
    topicName: 'West Bengal',
    chapterName: 'West Bengal',
    questionType: 'PYQ',
    sourceType: 'pyq',
    sourceYear: 2023,
    sourcePaper: 'Preliminary',
    explanation:
      'According to Census 2011, Uttar Dinajpur has the lowest literacy rate in West Bengal at 59.07%. East Midnapore has the highest (87.02%).',
    explanationBengali:
      '২০১১ সালের আদমশুমারি অনুযায়ী উত্তর দিনাজপুর জেলার সাক্ষরতার হার সবচেয়ে কম (৫৯.০৭%) এবং পূর্ব মেদিনীপুরের সবচেয়ে বেশি (৮৭.০২%)।',
    shortNotes:
      '• সর্বনিম্ন সাক্ষরতা: উত্তর দিনাজপুর (৫৯.০৭%)\n• সর্বোচ্চ সাক্ষরতা: পূর্ব মেদিনীপুর (৮৭.০২%)\n• পশ্চিমবঙ্গের সামগ্রিক সাক্ষরতা: ৭৭.০৮%',
    tags: ['West Bengal', 'Census', 'Geography'],
    status: 'published',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
  {
    id: '10406',
    questionText: 'What is the SI unit of electric current?',
    questionBengaliText: 'তড়িৎ প্রবাহমাত্রার এসআই (SI) একক কি?',
    optionA: 'Volt',
    optionB: 'Ohm',
    optionC: 'Ampere',
    optionD: 'Coulomb',
    correctOption: 'C',
    uploadMode: 'subject',
    subjectName: 'General Science',
    topicName: 'Chemical Reactions',
    chapterName: 'Chemical Reactions',
    questionType: 'Topic',
    sourceType: 'topic',
    explanation:
      'The SI unit of electric current is Ampere (A), named after French physicist André-Marie Ampère.',
    explanationBengali:
      'তড়িৎ প্রবাহমাত্রার এসআই একক হলো অ্যাম্পিয়ার (A)। কুলম্ব প্রতি সেকেন্ডকে এক অ্যাম্পিয়ার বলা হয়।',
    shortNotes:
      '• প্রবাহমাত্রা (I) = Q / t\n• বিভবপ্রভেদ: ভোল্ট (Volt)\n• রোধ: ওহম (Ohm)\n• আধান: কুলম্ব (Coulomb)',
    tags: ['Physics', 'Units', 'General Science'],
    status: 'published',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
  {
    id: '10405',
    questionText: 'Who founded the Arya Samaj in 1875?',
    questionBengaliText: '১৮৭৫ সালে আর্য সমাজ কে প্রতিষ্ঠা করেন?',
    optionA: 'Raja Ram Mohan Roy',
    optionB: 'Swami Dayananda Saraswati',
    optionC: 'Swami Vivekananda',
    optionD: 'Ishwar Chandra Vidyasagar',
    correctOption: 'B',
    uploadMode: 'exam',
    sourceExam: 'Railway NTPC',
    subjectName: 'History',
    topicName: 'Modern India',
    chapterName: 'Modern India',
    questionType: 'PYQ',
    sourceType: 'pyq',
    sourceYear: 2022,
    sourcePaper: 'CBT 1',
    explanation:
      'Swami Dayananda Saraswati founded Arya Samaj on 10 April 1875 in Bombay with the slogan "Go back to the Vedas".',
    explanationBengali:
      '১৮৭৫ সালের ১০ই এপ্রিল বোম্বাইতে স্বামী দয়ানন্দ সরস্বতী আর্য সমাজ প্রতিষ্ঠা করেন। তাঁর বিখ্যাত বার্তা ছিল "বেদে ফিরে যাও"।',
    shortNotes:
      '• শ্লোগান: Go Back to Vedas\n• বিখ্যাত গ্রন্থ: সত্যার্থ প্রকাশ\n• শুদ্ধি আন্দোলনের প্রবক্তা',
    tags: ['History', 'Arya Samaj', 'Railway'],
    status: 'under_review',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
  {
    id: '10404',
    questionText: 'Which gas is predominantly present in biogas and CNG?',
    questionBengaliText: 'বায়োগ্যাস এবং সিএনজি (CNG)-তে প্রধানত কোন গ্যাস থাকে?',
    optionA: 'Methane',
    optionB: 'Ethane',
    optionC: 'Propane',
    optionD: 'Butane',
    correctOption: 'A',
    uploadMode: 'subject',
    subjectName: 'General Science',
    topicName: 'Chemical Reactions',
    chapterName: 'Chemical Reactions',
    questionType: 'Topic',
    sourceType: 'topic',
    explanation:
      'Methane (CH4) makes up around 75-90% of CNG and about 50-70% of biogas.',
    explanationBengali:
      'বায়োগ্যাস এবং সিএনজি (CNG)-তে প্রধান উপাদান হিসেবে মিথেন (CH₄) গ্যাস উপস্থিত থাকে।',
    shortNotes: '• সংকেত: CH₄\n• মার্স গ্যাস (Marsh gas) নামে পরিচিত\n• গ্রিনহাউস গ্যাস',
    tags: ['Chemistry', 'Environment', 'Gases'],
    status: 'draft',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
  {
    id: '10403',
    questionText: 'What is the retirement age of a Judge of the Supreme Court of India?',
    questionBengaliText: 'ভারতের সুপ্রিম কোর্টের বিচারপতির অবসর গ্রহণের বয়স কত বছর?',
    optionA: '60 years',
    optionB: '62 years',
    optionC: '65 years',
    optionD: '68 years',
    correctOption: 'C',
    uploadMode: 'exam',
    sourceExam: 'WBSSC Group D',
    subjectName: 'Indian Polity',
    topicName: 'Constitution',
    chapterName: 'Constitution',
    questionType: 'PYQ',
    sourceType: 'pyq',
    sourceYear: 2021,
    sourcePaper: 'Preliminary',
    explanation:
      'A Supreme Court judge in India holds office until the age of 65 years. High Court judges retire at 62 years.',
    explanationBengali:
      'ভারতের সুপ্রিম কোর্টের বিচারপতিরা ৬৫ বছর বয়সে অবসর গ্রহণ করেন। অপরদিকে হাইকোর্টের বিচারপতিরা ৬২ বছর বয়সে অবসর নেন।',
    shortNotes:
      '• সুপ্রিম কোর্ট: ৬৫ বছর\n• হাইকোর্ট: ৬২ বছর\n• ধারা ১২৪ অনুযায়ী সুপ্রিম কোর্ট গঠিত',
    tags: ['Polity', 'Supreme Court', 'Judiciary'],
    status: 'published',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
  {
    id: '10402',
    questionText: 'Which animal is shown in the official emblem of West Bengal?',
    questionBengaliText: 'পশ্চিমবঙ্গ সরকারের রাজ্য প্রতীকটিতে কোন প্রতীক অঙ্কিত রয়েছে?',
    optionA: 'Biswa Bangla globe with Bengali letter "ব"',
    optionB: 'Royal Bengal Tiger',
    optionC: 'Fishing Cat',
    optionD: 'White-throated Kingfisher',
    correctOption: 'A',
    uploadMode: 'exam',
    sourceExam: 'WBP Constable',
    subjectName: 'Static GK',
    topicName: 'National Symbols',
    chapterName: 'National Symbols',
    questionType: 'PYQ',
    sourceType: 'pyq',
    sourceYear: 2023,
    sourcePaper: 'Preliminary',
    explanation:
      'The emblem of West Bengal consists of a circle depicting the Biswa Bangla motif with the Bengali alphabet letter "ব" at its center.',
    explanationBengali:
      'পশ্চিমবঙ্গ সরকারের রাজ্য প্রতীকে বৃত্তাকার বিশ্ব বাংলা গ্লোবের মাঝে বাংলা "ব" অক্ষরটি অঙ্কিত রয়েছে।',
    shortNotes:
      '• রাজ্য পশু: মেছো বিড়াল (Fishing Cat)\n• রাজ্য পাখি: ধনেশ / সাদা গলা মাছরাঙা\n• রাজ্য ফুল: শিউলি\n• রাজ্য গাছ: ছাতিম',
    tags: ['Static GK', 'West Bengal', 'Symbols'],
    status: 'published',
    isActive: true,
    defaultMarks: 1,
    defaultNegativeMarks: 0.25,
  },
];

export const AdminQuestionBank: React.FC = () => {
  // Master Taxonomy & State
  const [questions, setQuestions] = useState<Question[]>(
    isSupabaseConfigured ? [] : INITIAL_DEMO_QUESTIONS
  );
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Top Upload Mode Filter: 'all' | 'exam' | 'subject'
  const [activeUploadMode, setActiveUploadMode] = useState<'all' | 'exam' | 'subject'>('all');

  // Filter Bar State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewModeFilter, setViewModeFilter] = useState<'all' | 'exam' | 'subject'>('all');
  const [selectedExamFilter, setSelectedExamFilter] = useState('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('all');

  // Selected Rows for Bulk Actions
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Active / Opened Question in Right Drawer (Defaults to null - neutral initial state)
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [drawerTab, setDrawerTab] = useState<'details' | 'explanation' | 'history'>('details');

  // Drawer Edit Form States
  const [drawerBengaliText, setDrawerBengaliText] = useState('');
  const [drawerOptions, setDrawerOptions] = useState<{ [key: string]: string }>({
    A: '',
    B: '',
    C: '',
    D: '',
  });
  const [drawerCorrectOption, setDrawerCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [drawerUploadMode, setDrawerUploadMode] = useState<UploadMode>('exam');
  const [drawerExam, setDrawerExam] = useState('WBP Constable');
  const [drawerSubject, setDrawerSubject] = useState('History');
  const [drawerTopic, setDrawerTopic] = useState('Modern India');
  const [drawerType, setDrawerType] = useState('PYQ');
  const [drawerYear, setDrawerYear] = useState<number | string>(2025);
  const [drawerSource, setDrawerSource] = useState('Official PYQ');
  const [drawerStatus, setDrawerStatus] = useState<QuestionBankStatus>('published');
  const [drawerTags, setDrawerTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isUpdatingDrawer, setIsUpdatingDrawer] = useState(false);

  // Drawer Explanation Edit State
  const [editExplanation, setEditExplanation] = useState('');

  // Floating Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Top-Right Action Menus & Modals
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalUploadMode, setModalUploadMode] = useState<UploadMode>('exam');

  // Add Modal Form State
  const [addExam, setAddExam] = useState('WBP Constable');
  const [addExamQuestionType, setAddExamQuestionType] = useState<'Full Mock' | 'Official PYQ'>('Official PYQ');
  const [addYear, setAddYear] = useState('2025');
  const [addPaper, setAddPaper] = useState('Set A');
  const [addSection, setAddSection] = useState('General Awareness');
  const [addSubject, setAddSubject] = useState('General Science');
  const [addTopic, setAddTopic] = useState('Heat & Temperature');
  const [addSubtopic, setAddSubtopic] = useState('');
  const [addQuestionBengali, setAddQuestionBengali] = useState('');
  const [addQuestionEnglish, setAddQuestionEnglish] = useState('');
  const [addOptA, setAddOptA] = useState('');
  const [addOptB, setAddOptB] = useState('');
  const [addOptC, setAddOptC] = useState('');
  const [addOptD, setAddOptD] = useState('');
  const [addCorrect, setAddCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [addMarks, setAddMarks] = useState(1);
  const [addNegativeMarks, setAddNegativeMarks] = useState(0.25);
  const [addExplanation, setAddExplanation] = useState('');
  const [addSource, setAddSource] = useState('Official PYQ');
  const [addTags, setAddTags] = useState<string[]>([]);
  const [addTagInput, setAddTagInput] = useState('');
  const [addStatus, setAddStatus] = useState<QuestionBankStatus>('published');
  const [duplicateWarning, setDuplicateWarning] = useState<{ similarity: number; existingText: string } | null>(null);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Bulk Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<UploadMode>('exam');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedImportQuestions, setParsedImportQuestions] = useState<Question[]>([]);
  const [importPreviewStats, setImportPreviewStats] = useState<{
    total: number;
    valid: number;
    errors: number;
    duplicates: number;
    errorList: string[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Template Download Menu State
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);

  // Row Action Dropdown state (row id)
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveActionMenuId(null);
      setIsAddMenuOpen(false);
      setIsTemplateMenuOpen(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load Real Data from Backend API / Supabase
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allQuestions, allExams, allSubjects, allChapters] = await Promise.all([
        api.getAllAdminQuestions().catch(() => []),
        api.getAllAdminExams().catch(() => []),
        api.getAllAdminSubjects().catch(() => []),
        api.getAllAdminChapters().catch(() => []),
      ]);

      if (allExams && allExams.length > 0) setExams(allExams);
      if (allSubjects && allSubjects.length > 0) setSubjects(allSubjects);
      if (allChapters && allChapters.length > 0) setTopics(allChapters);

      if (isSupabaseConfigured) {
        setQuestions(allQuestions || []);
      } else {
        if (allQuestions && allQuestions.length > 0) {
          // Merge without losing initial demo questions
          const existingIds = new Set(INITIAL_DEMO_QUESTIONS.map((dq) => dq.id));
          const merged = [
            ...INITIAL_DEMO_QUESTIONS,
            ...allQuestions.filter((q) => !existingIds.has(q.id)),
          ];
          setQuestions(merged);
        }
      }
    } catch (err) {
      console.warn('Backend load note:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Synchronize drawer fields whenever activeQuestion changes
  useEffect(() => {
    if (activeQuestion) {
      setDrawerBengaliText(activeQuestion.questionBengaliText || activeQuestion.questionText || '');
      setDrawerOptions({
        A: activeQuestion.optionA || '',
        B: activeQuestion.optionB || '',
        C: activeQuestion.optionC || '',
        D: activeQuestion.optionD || '',
      });
      setDrawerCorrectOption((activeQuestion.correctOption as 'A' | 'B' | 'C' | 'D') || 'A');
      setDrawerUploadMode((activeQuestion.uploadMode as UploadMode) || (activeQuestion.sourceExam ? 'exam' : 'subject'));
      setDrawerExam(activeQuestion.sourceExam || 'WBP Constable');
      setDrawerSubject(activeQuestion.subjectName || 'History');
      setDrawerTopic(activeQuestion.topicName || activeQuestion.chapterName || 'Modern India');
      setDrawerType(activeQuestion.questionType || (activeQuestion.sourceType === 'pyq' ? 'PYQ' : 'Topic'));
      setDrawerYear(activeQuestion.sourceYear || 2025);
      setDrawerSource(
        activeQuestion.sourceType === 'pyq'
          ? 'Official PYQ'
          : activeQuestion.sourceType === 'topic'
            ? 'Original'
            : 'Reference'
      );
      setDrawerStatus((activeQuestion.status as QuestionBankStatus) || 'published');
      setEditExplanation(
        activeQuestion.explanationBengali ||
        activeQuestion.explanation ||
        activeQuestion.shortNotes ||
        ''
      );
    }
  }, [activeQuestion]);

  // Filtered Questions Dataset
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // 1. Top Selector Mode Filter (By Exam vs By Subject)
      if (activeUploadMode === 'exam' && q.uploadMode !== 'exam' && !q.sourceExam) return false;
      if (activeUploadMode === 'subject' && q.uploadMode === 'exam' && q.sourceExam) return false;

      // 2. View Mode Filter
      if (viewModeFilter === 'exam' && q.uploadMode !== 'exam' && !q.sourceExam) return false;
      if (viewModeFilter === 'subject' && q.uploadMode === 'exam' && q.sourceExam) return false;

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesBen = q.questionBengaliText?.toLowerCase().includes(query);
        const matchesEng = q.questionText?.toLowerCase().includes(query);
        const matchesOptA = q.optionA?.toLowerCase().includes(query);
        const matchesOptB = q.optionB?.toLowerCase().includes(query);
        const matchesOptC = q.optionC?.toLowerCase().includes(query);
        const matchesOptD = q.optionD?.toLowerCase().includes(query);
        const matchesId = q.id?.toLowerCase().includes(query);
        const matchesTopic = q.topicName?.toLowerCase().includes(query) || q.chapterName?.toLowerCase().includes(query);
        const matchesExam = q.sourceExam?.toLowerCase().includes(query);
        const matchesSubject = q.subjectName?.toLowerCase().includes(query);

        if (
          !matchesBen &&
          !matchesEng &&
          !matchesOptA &&
          !matchesOptB &&
          !matchesOptC &&
          !matchesOptD &&
          !matchesId &&
          !matchesTopic &&
          !matchesExam &&
          !matchesSubject
        ) {
          return false;
        }
      }

      // 4. Exam Filter
      if (selectedExamFilter !== 'all') {
        if (!q.sourceExam || !q.sourceExam.toLowerCase().includes(selectedExamFilter.toLowerCase())) {
          return false;
        }
      }

      // 5. Subject Filter
      if (selectedSubjectFilter !== 'all') {
        if (!q.subjectName || !q.subjectName.toLowerCase().includes(selectedSubjectFilter.toLowerCase())) {
          return false;
        }
      }

      // 6. Topic Filter
      if (selectedTopicFilter !== 'all') {
        const top = q.topicName || q.chapterName || '';
        if (!top.toLowerCase().includes(selectedTopicFilter.toLowerCase())) {
          return false;
        }
      }

      // 7. Type Filter
      if (selectedTypeFilter !== 'all') {
        const t = (q.questionType || (q.sourceType === 'pyq' ? 'PYQ' : 'Topic')).toLowerCase();
        if (t !== selectedTypeFilter.toLowerCase()) return false;
      }

      // 8. Status Filter
      if (selectedStatusFilter !== 'all') {
        const s = (q.status || 'published').toLowerCase();
        if (s !== selectedStatusFilter.toLowerCase()) return false;
      }

      // 9. Year Filter
      if (selectedYearFilter !== 'all') {
        if (String(q.sourceYear) !== selectedYearFilter) return false;
      }

      // 10. Source Filter
      if (selectedSourceFilter !== 'all') {
        const src = (q.sourceType === 'pyq' ? 'Official PYQ' : 'Original').toLowerCase();
        if (!src.includes(selectedSourceFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [
    questions,
    activeUploadMode,
    searchQuery,
    viewModeFilter,
    selectedExamFilter,
    selectedSubjectFilter,
    selectedTopicFilter,
    selectedTypeFilter,
    selectedStatusFilter,
    selectedYearFilter,
    selectedSourceFilter,
  ]);

  // Statistics calculation grounded to database numbers
  const stats = useMemo(() => {
    if (isSupabaseConfigured) {
      const total = questions.length;
      const examQuestions = questions.filter(
        (q) => q.uploadMode === 'exam' || Boolean(q.sourceExam)
      ).length;
      const subjectQuestions = questions.filter(
        (q) => q.uploadMode === 'subject' || (!q.sourceExam && Boolean(q.subjectId || q.subjectName))
      ).length;
      const published = questions.filter(
        (q) => (q.status || 'published') === 'published'
      ).length;
      const draft = questions.filter((q) => q.status === 'draft').length;
      const underReview = questions.filter(
        (q) => (q.status as string) === 'under_review' || (q.status as string) === 'review'
      ).length;
      return {
        total,
        examQuestions,
        subjectQuestions,
        published,
        draft,
        underReview,
      };
    }
    return {
      total: 12430,
      examQuestions: 7250,
      subjectQuestions: 5180,
      published: 11120,
      draft: 320,
      underReview: 450,
    };
  }, [questions]);

  // Paginated List
  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  // Checkbox Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRowIds(new Set(paginatedQuestions.map((q) => q.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Bulk Status Change
  const handleBulkStatusChange = async (newStatus: QuestionBankStatus) => {
    if (selectedRowIds.size === 0) return;
    const ids = Array.from(selectedRowIds);
    try {
      const dbStatus =
        newStatus === 'published' ? 'active' : newStatus === 'archived' ? 'archived' : 'draft';
      const res = await api.updateQuestionsStatus(ids, dbStatus);
      setQuestions((prev) =>
        prev.map((q) => (ids.includes(q.id) ? { ...q, status: newStatus } : q))
      );
      if (activeQuestion && ids.includes(activeQuestion.id)) {
        setActiveQuestion((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      setSelectedRowIds(new Set());
      showToast(`Updated status of ${res.updatedCount} questions to ${newStatus}.`);
    } catch (err) {
      showToast(`Error updating status: ${getErrorMessage(err, 'Failed to update status')}`);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedRowIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedRowIds.size} selected questions?`)) {
      return;
    }
    const ids = Array.from(selectedRowIds);
    try {
      const res = await api.deleteQuestions(ids);
      setQuestions((prev) => prev.filter((q) => !ids.includes(q.id)));
      if (activeQuestion && ids.includes(activeQuestion.id)) {
        setActiveQuestion(null);
      }
      setSelectedRowIds(new Set());
      showToast(`Deleted ${res.deletedCount} questions.`);
    } catch (err) {
      showToast(`Error deleting questions: ${getErrorMessage(err, 'Failed to bulk delete')}`);
    }
  };

  // Export Selected to CSV
  const handleExportSelectedCSV = () => {
    if (selectedRowIds.size === 0) return;
    const toExport = questions.filter((q) => selectedRowIds.has(q.id));
    const headers = ['id', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct', 'exam', 'subject', 'topic', 'status'];
    const rows = toExport.map((q) => [
      q.id,
      q.questionBengaliText || q.questionText,
      q.optionA,
      q.optionB,
      q.optionC,
      q.optionD,
      q.correctOption,
      q.sourceExam || '',
      q.subjectName || '',
      q.topicName || '',
      q.status || 'published',
    ]);
    const csvContent =
      '\uFEFF' +
      headers.join(',') +
      '\n' +
      rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `practicekoro_selected_questions_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${toExport.length} questions to CSV.`);
  };

  // Drawer Update Handler
  const handleUpdateDrawer = async () => {
    if (!activeQuestion) return;
    try {
      setIsUpdatingDrawer(true);
      const updatedQuestionData: Partial<Question> = {
        questionBengaliText: drawerBengaliText.trim(),
        questionText: drawerBengaliText.trim(),
        optionA: drawerOptions.A.trim(),
        optionB: drawerOptions.B.trim(),
        optionC: drawerOptions.C.trim(),
        optionD: drawerOptions.D.trim(),
        correctOption: drawerCorrectOption,
        uploadMode: drawerUploadMode,
        sourceExam: drawerUploadMode === 'exam' ? drawerExam : undefined,
        subjectName: drawerSubject,
        topicName: drawerTopic,
        chapterName: drawerTopic,
        questionType: drawerType,
        sourceYear: drawerYear ? Number(drawerYear) : undefined,
        status: drawerStatus,
        tags: drawerTags,
        explanation: editExplanation.trim(),
        explanationBengali: editExplanation.trim(),
        shortNotes: editExplanation.trim(),
      };

      const saved = await api.updateQuestion(activeQuestion.id, updatedQuestionData);
      setQuestions((prev) =>
        prev.map((q) => (q.id === activeQuestion.id ? { ...q, ...saved } : q))
      );
      setActiveQuestion((prev) => (prev ? { ...prev, ...saved } : saved));
      showToast('Question updated successfully in database!');
    } catch (err) {
      showToast(`Error updating question: ${getErrorMessage(err, 'Failed to update')}`);
    } finally {
      setIsUpdatingDrawer(false);
    }
  };

  // Drawer Delete Handler
  const handleDeleteActiveQuestion = async () => {
    if (!activeQuestion) return;
    if (!window.confirm(`Delete question #${activeQuestion.id}? This will remove it from mock tests.`)) {
      return;
    }
    try {
      await api.deleteQuestion(activeQuestion.id);
      setQuestions((prev) => prev.filter((q) => q.id !== activeQuestion.id));
      setActiveQuestion(null);
      showToast('Question deleted successfully from database.');
    } catch (err) {
      showToast(`Error deleting question: ${getErrorMessage(err, 'Failed to delete')}`);
    }
  };

  // Add Tag in Drawer
  const handleAddDrawerTag = () => {
    if (newTagInput.trim() && !drawerTags.includes(newTagInput.trim())) {
      setDrawerTags([...drawerTags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveDrawerTag = (tagToRemove: string) => {
    setDrawerTags(drawerTags.filter((t) => t !== tagToRemove));
  };

  // Shuffle Options in Drawer
  const handleShuffleDrawerOptions = () => {
    const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const currentCorrectText = drawerOptions[drawerCorrectOption];
    const values = [drawerOptions.A, drawerOptions.B, drawerOptions.C, drawerOptions.D].sort(
      () => Math.random() - 0.5
    );
    const newOpts: { [key: string]: string } = {
      A: values[0],
      B: values[1],
      C: values[2],
      D: values[3],
    };
    const newCorrect = keys.find((k) => newOpts[k] === currentCorrectText) || 'A';
    setDrawerOptions(newOpts);
    setDrawerCorrectOption(newCorrect);
    showToast('Options shuffled randomly.');
  };

  // Duplicate Detection Logic
  const checkDuplicate = (text: string) => {
    if (!text || text.length < 8) {
      setDuplicateWarning(null);
      return;
    }
    const cleanText = text.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');
    for (const q of questions) {
      const existing = (q.questionBengaliText || q.questionText || '')
        .toLowerCase()
        .replace(/[^a-z0-9\u0980-\u09FF]/g, '');
      if (existing.length < 5) continue;
      if (cleanText.includes(existing) || existing.includes(cleanText)) {
        setDuplicateWarning({
          similarity: 94,
          existingText: q.questionBengaliText || q.questionText,
        });
        return;
      }
    }
    setDuplicateWarning(null);
  };

  // Handle Add Question Submission
  const handleCreateQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addQuestionBengali.trim() && !addQuestionEnglish.trim()) {
      showToast('Question text is required.');
      return;
    }
    if (!addOptA.trim() || !addOptB.trim()) {
      showToast('Options A and B are required.');
      return;
    }

    try {
      setIsSubmittingAdd(true);
      const newQuestionPayload: Omit<Question, 'id'> = {
        questionBengaliText: addQuestionBengali.trim(),
        questionText: addQuestionEnglish.trim() || addQuestionBengali.trim(),
        optionA: addOptA.trim(),
        optionB: addOptB.trim(),
        optionC: addOptC.trim() || 'None of the above',
        optionD: addOptD.trim() || 'All of the above',
        correctOption: addCorrect,
        uploadMode: modalUploadMode,
        sourceExam: modalUploadMode === 'exam' ? addExam : undefined,
        subjectName: modalUploadMode === 'subject' ? addSubject : 'General Awareness',
        topicName: modalUploadMode === 'subject' ? addTopic : 'PYQ',
        chapterName: modalUploadMode === 'subject' ? addTopic : 'PYQ',
        subtopic: addSubtopic || undefined,
        questionType:
          modalUploadMode === 'exam'
            ? addExamQuestionType === 'Official PYQ'
              ? 'PYQ'
              : 'Full Mock'
            : 'Topic',
        sourceType:
          modalUploadMode === 'exam'
            ? addExamQuestionType === 'Official PYQ'
              ? 'pyq'
              : 'other'
            : 'topic',
        sourceYear: modalUploadMode === 'exam' ? Number(addYear) : undefined,
        sourcePaper: modalUploadMode === 'exam' ? addPaper : undefined,
        section: modalUploadMode === 'exam' ? addSection : undefined,
        explanation: addExplanation.trim(),
        explanationBengali: addExplanation.trim(),
        shortNotes: addExplanation.trim(),
        tags: addTags.length > 0 ? addTags : [modalUploadMode === 'exam' ? addExam : addSubject],
        status: addStatus,
        isActive: true,
        defaultMarks: addMarks,
        defaultNegativeMarks: addNegativeMarks,
      };

      const createdQuestion = await api.createQuestion(newQuestionPayload);

      setQuestions((prev) => [createdQuestion, ...prev]);
      setActiveQuestion(createdQuestion);
      setIsAddModalOpen(false);

      // Reset form
      setAddQuestionBengali('');
      setAddQuestionEnglish('');
      setAddOptA('');
      setAddOptB('');
      setAddOptC('');
      setAddOptD('');
      setAddExplanation('');
      setAddTags([]);
      setDuplicateWarning(null);
      showToast('Question created successfully in database!');
    } catch (err) {
      showToast(`Error creating question: ${getErrorMessage(err, 'Failed to create')}`);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Download Templates (.CSV) with UTF-8 BOM for Bengali support
  const downloadTemplate = (mode: UploadMode) => {
    let headers: string[] = [];
    let sampleRow: string[] = [];

    if (mode === 'exam') {
      headers = [
        'exam',
        'question_type',
        'year',
        'paper',
        'question',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'correct_answer',
        'marks',
        'negative_marks',
        'explanation',
        'short_notes',
        'source',
        'tags',
      ];
      sampleRow = [
        'WBP Constable',
        'Official PYQ',
        '2025',
        'Set A',
        'ভারতের প্রথম গভর্নর-জেনারেল কে ছিলেন?',
        'Warren Hastings',
        'Lord Cornwallis',
        'Lord Wellesley',
        'Lord Canning',
        'A',
        '1.0',
        '0.25',
        '১৭৭৩ সালের রেগুলেটিং অ্যাক্টের মাধ্যমে ওয়ারেন হেস্টিংস গভর্নর-জেনারেল হন।',
        '• ১৭৭৩: রেগুলেটিং অ্যাক্ট\n• ওয়ারেন হেস্টিংস প্রথম গভর্নর-জেনারেল',
        'Official PYQ',
        'WBP;Modern India',
      ];
    } else {
      headers = [
        'subject',
        'topic',
        'subtopic',
        'question',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'correct_answer',
        'marks',
        'negative_marks',
        'explanation',
        'short_notes',
        'source',
        'tags',
      ];
      sampleRow = [
        'General Science',
        'Chemical Reactions',
        'Water Chemistry',
        'H₂O এর রাসায়নিক নাম কি?',
        'Hydrogen Peroxide',
        'Dihydrogen Monoxide',
        'Hydrogen Dioxide',
        'Hydroxide Ion',
        'B',
        '1.0',
        '0.25',
        'জলের রাসায়নিক নাম হলো ডাইহাইড্রোজেন মনোক্সাইড।',
        '• সংকেত: H₂O\n• মোলার ভর: ১৮ গ্রাম',
        'Original',
        'Science;Chemistry',
      ];
    }

    const csvContent =
      '\uFEFF' +
      headers.join(',') +
      '\n' +
      sampleRow.map((v) => `"${v.replace(/"/g, '""')}"`).join(',');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `practicekoro_questions_${mode}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded ${mode === 'exam' ? 'Exam' : 'Subject'} CSV Template.`);
  };

  // Real File Upload Parser & Validator
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length <= 1) {
        setImportPreviewStats({
          total: 0,
          valid: 0,
          errors: 1,
          duplicates: 0,
          errorList: ['The uploaded file is empty or missing headers.'],
        });
        return;
      }

      const rows = lines.slice(1);
      const parsed: Question[] = [];
      const errors: string[] = [];

      rows.forEach((line, idx) => {
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((p) => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 7) {
          const qText = parts[modeIdx(importMode, 'question')];
          const optA = parts[modeIdx(importMode, 'optA')];
          const optB = parts[modeIdx(importMode, 'optB')];
          const optC = parts[modeIdx(importMode, 'optC')] || 'Option C';
          const optD = parts[modeIdx(importMode, 'optD')] || 'Option D';
          const correct = (parts[modeIdx(importMode, 'correct')]?.toUpperCase() || 'A') as 'A' | 'B' | 'C' | 'D';

          if (!qText) {
            errors.push(`Row ${idx + 2}: Question text is empty`);
            return;
          }
          if (!optA || !optB) {
            errors.push(`Row ${idx + 2}: Options A and B are mandatory`);
            return;
          }

          parsed.push({
            id: crypto.randomUUID(),
            questionBengaliText: qText,
            questionText: qText,
            optionA: optA,
            optionB: optB,
            optionC: optC,
            optionD: optD,
            correctOption: ['A', 'B', 'C', 'D'].includes(correct) ? correct : 'A',
            uploadMode: importMode,
            sourceExam: importMode === 'exam' ? parts[0] || 'WBP Constable' : undefined,
            subjectName: importMode === 'subject' ? parts[0] || 'General Science' : 'General Awareness',
            topicName: importMode === 'subject' ? parts[1] || 'Important Topics' : 'Mock Test',
            status: 'published',
            isActive: true,
            defaultMarks: 1,
            defaultNegativeMarks: 0.25,
            explanationBengali: parts[modeIdx(importMode, 'explanation')] || '',
            shortNotes: parts[modeIdx(importMode, 'shortNotes')] || '',
          });
        }
      });

      setParsedImportQuestions(parsed);
      setImportPreviewStats({
        total: rows.length,
        valid: parsed.length,
        errors: errors.length,
        duplicates: 0,
        errorList: errors.slice(0, 5),
      });
    };
    reader.readAsText(file);
  };

  const modeIdx = (mode: UploadMode, field: string) => {
    if (mode === 'exam') {
      switch (field) {
        case 'question': return 4;
        case 'optA': return 5;
        case 'optB': return 6;
        case 'optC': return 7;
        case 'optD': return 8;
        case 'correct': return 9;
        case 'explanation': return 12;
        case 'shortNotes': return 13;
        default: return 0;
      }
    } else {
      switch (field) {
        case 'question': return 3;
        case 'optA': return 4;
        case 'optB': return 5;
        case 'optC': return 6;
        case 'optD': return 7;
        case 'correct': return 8;
        case 'explanation': return 11;
        case 'shortNotes': return 12;
        default: return 0;
      }
    }
  };

  // Execute Real Bulk Import with controlled concurrency, real IDs and error retention
  const handleExecuteImport = async () => {
    if (!importPreviewStats || parsedImportQuestions.length === 0) return;
    setIsImporting(true);

    const successfullyCreated: Question[] = [];
    const failedQuestions: Question[] = [];
    const errorDetails: string[] = [];

    const CHUNK_SIZE = 5;
    for (let i = 0; i < parsedImportQuestions.length; i += CHUNK_SIZE) {
      const chunk = parsedImportQuestions.slice(i, i + CHUNK_SIZE);
      const results = await Promise.allSettled(
        chunk.map((q) => {
          const { id: _, ...payload } = q;
          return api.createQuestion(payload);
        })
      );

      results.forEach((res, idx) => {
        const originalQuestion = chunk[idx];
        if (res.status === 'fulfilled') {
          successfullyCreated.push(res.value);
        } else {
          failedQuestions.push(originalQuestion);
          const reason =
            res.reason instanceof Error ? res.reason.message : 'Unknown database error';
          errorDetails.push(
            `Question "${originalQuestion.questionText.slice(0, 30)}...": ${reason}`
          );
        }
      });
    }

    setIsImporting(false);

    if (successfullyCreated.length > 0) {
      setQuestions((prev) => [...successfullyCreated, ...prev]);
    }

    if (failedQuestions.length === 0) {
      // All succeeded
      setIsImportModalOpen(false);
      setImportFile(null);
      setParsedImportQuestions([]);
      setImportPreviewStats(null);
      showToast(`Successfully imported ${successfullyCreated.length} questions into Question Bank!`);
    } else {
      // Partial or total failure - retain failed rows for retry
      setParsedImportQuestions(failedQuestions);
      setImportPreviewStats({
        total: failedQuestions.length,
        valid: failedQuestions.length,
        errors: failedQuestions.length,
        duplicates: 0,
        errorList: errorDetails.slice(0, 5),
      });
      if (successfullyCreated.length > 0) {
        showToast(
          `Imported ${successfullyCreated.length} questions. ${failedQuestions.length} questions failed; examine errors and retry.`
        );
      } else {
        showToast(
          `Import failed for all ${failedQuestions.length} questions. Please check the errors.`
        );
      }
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. PAGE HEADER (Pixel-matched to media_1791132993733.jpg) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Question Bank</h1>
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-[#026BFC]" />}
          </div>
          <p className="text-xs font-normal text-slate-500 mt-1">
            Manage all questions. Add, edit, review and organize questions.
          </p>
        </div>

        {/* Top-Right Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Import Questions */}
          <button
            type="button"
            onClick={() => {
              setImportPreviewStats(null);
              setImportFile(null);
              setParsedImportQuestions([]);
              setIsImportModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Questions</span>
          </button>

          {/* Download Template Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsTemplateMenuOpen(!isTemplateMenuOpen);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download Template</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isTemplateMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1.5 animate-in fade-in"
              >
                <button
                  type="button"
                  onClick={() => {
                    downloadTemplate('exam');
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-[#026BFC] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>By Exam Template (.csv)</span>
                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadTemplate('subject');
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>By Subject Template (.csv)</span>
                  <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                </button>
              </div>
            )}
          </div>

          {/* + Add Question Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddMenuOpen(!isAddMenuOpen);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isAddMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1.5 animate-in fade-in"
              >
                <button
                  type="button"
                  onClick={() => {
                    setModalUploadMode('exam');
                    setIsAddModalOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-[#026BFC] rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>+ Add by Exam</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalUploadMode('subject');
                    setIsAddModalOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <span>+ Add by Subject</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. UPLOAD MODE SELECTOR CARDS (BY EXAM VS BY SUBJECT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BY EXAM CARD */}
        <div
          onClick={() => {
            const nextMode = activeUploadMode === 'exam' ? 'all' : 'exam';
            setActiveUploadMode(nextMode);
            setViewModeFilter(nextMode);
            setCurrentPage(1);
            showToast(nextMode === 'exam' ? 'Filtered by Exam questions.' : 'Showing all questions.');
          }}
          className={cn(
            'flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer select-none',
            activeUploadMode === 'exam'
              ? 'bg-blue-50/70 border-[#026BFC] shadow-sm ring-1 ring-[#026BFC]/30'
              : 'bg-white border-slate-200/80 hover:border-blue-300'
          )}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#026BFC] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">By Exam</h3>
              {activeUploadMode === 'exam' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  Active Filter
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              Upload questions for a specific exam
            </p>
            <p className="text-[11px] font-normal text-slate-400">
              (Used for Full Mock Tests & Official PYQs)
            </p>
          </div>
        </div>

        {/* BY SUBJECT CARD */}
        <div
          onClick={() => {
            const nextMode = activeUploadMode === 'subject' ? 'all' : 'subject';
            setActiveUploadMode(nextMode);
            setViewModeFilter(nextMode);
            setCurrentPage(1);
            showToast(nextMode === 'subject' ? 'Filtered by Subject questions.' : 'Showing all questions.');
          }}
          className={cn(
            'flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer select-none',
            activeUploadMode === 'subject'
              ? 'bg-purple-50/70 border-purple-500 shadow-sm ring-1 ring-purple-500/30'
              : 'bg-white border-slate-200/80 hover:border-purple-300'
          )}
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">By Subject</h3>
              {activeUploadMode === 'subject' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                  Active Filter
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              Upload subject-wise questions
            </p>
            <p className="text-[11px] font-normal text-slate-400">
              (Used for Topic Tests)
            </p>
          </div>
        </div>
      </div>

      {/* 3. SIX STAT METRIC CARDS (Exact values & styling from media_1791132993733.jpg) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Questions */}
        <div
          onClick={() => {
            setActiveUploadMode('all');
            setViewModeFilter('all');
            setSelectedStatusFilter('all');
            setCurrentPage(1);
          }}
          className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs cursor-pointer hover:shadow-xs transition-shadow"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#026BFC] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Total Questions</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {stats.total.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">↑ 12%</span>
          </div>
          <p className="text-[10px] font-normal text-slate-400 mt-0.5">vs last month</p>
        </div>

        {/* Card 2: Exam Questions */}
        <div
          onClick={() => {
            setActiveUploadMode('exam');
            setViewModeFilter('exam');
            setCurrentPage(1);
          }}
          className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs cursor-pointer hover:shadow-xs transition-shadow"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Exam Questions</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {stats.examQuestions.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">↑ 18%</span>
          </div>
          <p className="text-[10px] font-normal text-slate-400 mt-0.5">Full Mocks & PYQs</p>
        </div>

        {/* Card 3: Subject Questions */}
        <div
          onClick={() => {
            setActiveUploadMode('subject');
            setViewModeFilter('subject');
            setCurrentPage(1);
          }}
          className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs cursor-pointer hover:shadow-xs transition-shadow"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Subject Questions</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {stats.subjectQuestions.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">↑ 8%</span>
          </div>
          <p className="text-[10px] font-normal text-slate-400 mt-0.5">For Topic Tests</p>
        </div>

        {/* Card 4: Published */}
        <div
          onClick={() => {
            setSelectedStatusFilter('published');
            setCurrentPage(1);
          }}
          className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs cursor-pointer hover:shadow-xs transition-shadow"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Published</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {stats.published.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">↑ 15%</span>
          </div>
          <p className="text-[10px] font-normal text-slate-400 mt-0.5">Ready to use</p>
        </div>

        {/* Card 5: Draft */}
        <div
          onClick={() => {
            setSelectedStatusFilter('draft');
            setCurrentPage(1);
          }}
          className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs cursor-pointer hover:shadow-xs transition-shadow"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Draft</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {stats.draft.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-semibold text-rose-500">↓ 5%</span>
          </div>
          <p className="text-[10px] font-normal text-slate-400 mt-0.5">Not published</p>
        </div>

        {/* Card 6: Under Review */}
        <div
          onClick={() => {
            setSelectedStatusFilter('under_review');
            setCurrentPage(1);
          }}
          className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs cursor-pointer hover:shadow-xs transition-shadow"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Under Review</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {stats.underReview.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">↑ 8%</span>
          </div>
          <p className="text-[10px] font-normal text-slate-400 mt-0.5">Needs check</p>
        </div>
      </div>

      {/* 4. SEARCH AND FILTERS TOOLBAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        {/* Row 1: Search, View Mode, Exam, Subject, Topic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search questions..."
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl pl-10 pr-7 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#026BFC]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Mode */}
          <div>
            <select
              value={viewModeFilter}
              onChange={(e) => {
                const val = e.target.value as 'all' | 'exam' | 'subject';
                setViewModeFilter(val);
                setActiveUploadMode(val);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">View Mode: All Questions</option>
              <option value="exam">View Mode: By Exam</option>
              <option value="subject">View Mode: By Subject</option>
            </select>
          </div>

          {/* Exam Filter */}
          <div>
            <select
              value={selectedExamFilter}
              onChange={(e) => {
                setSelectedExamFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={viewModeFilter === 'subject'}
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#026BFC] disabled:opacity-40 cursor-pointer"
            >
              <option value="all">Exam: All Exams</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.title}>
                  {ex.title}
                </option>
              ))}
              <option value="WBP Constable">WBP Constable</option>
              <option value="WBSSC Group C">WBSSC Group C</option>
              <option value="WBSSC Group D">WBSSC Group D</option>
              <option value="Railway NTPC">Railway NTPC</option>
              <option value="ICDS">ICDS</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => {
                setSelectedSubjectFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">Subject: All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
              <option value="History">History</option>
              <option value="General Science">General Science</option>
              <option value="Indian Polity">Indian Polity</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Geography">Geography</option>
              <option value="Economy">Economy</option>
              <option value="General Knowledge">General Knowledge</option>
              <option value="Static GK">Static GK</option>
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <select
              value={selectedTopicFilter}
              onChange={(e) => {
                setSelectedTopicFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">Topic: All Topics</option>
              {topics.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
              <option value="Modern India">Modern India</option>
              <option value="Chemical Reactions">Chemical Reactions</option>
              <option value="Constitution">Constitution</option>
              <option value="BODMAS">BODMAS</option>
              <option value="Rivers of India">Rivers of India</option>
              <option value="Indian Economy">Indian Economy</option>
              <option value="West Bengal">West Bengal</option>
              <option value="Human Body">Human Body</option>
              <option value="National Symbols">National Symbols</option>
            </select>
          </div>
        </div>

        {/* Row 2: Type, Status, Year, Source, Filter, Reset */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-center">
          {/* Type Filter */}
          <div>
            <select
              value={selectedTypeFilter}
              onChange={(e) => {
                setSelectedTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">Type: All Types</option>
              <option value="pyq">PYQ</option>
              <option value="topic">Topic</option>
              <option value="full mock">Full Mock</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">Status: All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="under_review">Under Review</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYearFilter}
              onChange={(e) => {
                setSelectedYearFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">Year: All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={selectedSourceFilter}
              onChange={(e) => {
                setSelectedSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">Source: All Sources</option>
              <option value="official pyq">Official PYQ</option>
              <option value="original">Original</option>
              <option value="reference">Reference</option>
              <option value="ai-assisted">AI-assisted</option>
            </select>
          </div>

          {/* Action Buttons: Filter & Reset */}
          <div className="col-span-2 flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                showToast(`Filters active: ${filteredQuestions.length} questions matching.`);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setViewModeFilter('all');
                setActiveUploadMode('all');
                setSelectedExamFilter('all');
                setSelectedSubjectFilter('all');
                setSelectedTopicFilter('all');
                setSelectedTypeFilter('all');
                setSelectedStatusFilter('all');
                setSelectedYearFilter('all');
                setSelectedSourceFilter('all');
                setCurrentPage(1);
                showToast('Filters reset to default.');
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* BULK SELECTION ACTION BAR */}
      {selectedRowIds.size > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-blue-50 border border-blue-200 rounded-2xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#026BFC] text-white font-bold text-xs flex items-center justify-center">
              {selectedRowIds.size}
            </span>
            <span className="text-xs font-bold text-blue-900">
              Questions Selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleBulkStatusChange('published')}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
            >
              Publish
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatusChange('draft')}
              className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer"
            >
              Move to Draft
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatusChange('archived')}
              className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 cursor-pointer"
            >
              Archive
            </button>
            <button
              type="button"
              onClick={handleExportSelectedCSV}
              className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-50 cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 cursor-pointer"
            >
              Delete Selected ({selectedRowIds.size})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRowIds(new Set())}
              className="text-slate-500 hover:text-slate-800 text-xs px-2 cursor-pointer font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 5. MAIN CONTENT GRID (TABLE 8 COLS, DRAWER 4 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: QUESTION DATA TABLE */}
        <div
          className={cn(
            'transition-all duration-300',
            activeQuestion ? 'lg:col-span-8' : 'lg:col-span-12'
          )}
        >
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-slate-200/80">
                  <tr className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 w-8">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          paginatedQuestions.length > 0 &&
                          paginatedQuestions.every((q) => selectedRowIds.has(q.id))
                        }
                        title={`Select All (${filteredQuestions.length} Questions)`}
                        className="rounded border-slate-300 text-[#026BFC] focus:ring-[#026BFC] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-2 w-12 text-center">#</th>
                    <th className="py-3 px-4">Question (Preview)</th>
                    <th className="py-3 px-3">Mode</th>
                    <th className="py-3 px-3">Exam / Subject</th>
                    <th className="py-3 px-3">Topic</th>
                    <th className="py-3 px-2">Type</th>
                    <th className="py-3 px-2">Year</th>
                    <th className="py-3 px-3">Source</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-medium">
                  {paginatedQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        No questions found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedQuestions.map((q, idx) => {
                      const isSelected = selectedRowIds.has(q.id);
                      const isActive = activeQuestion?.id === q.id;
                      const isExamMode = q.uploadMode === 'exam' || Boolean(q.sourceExam);
                      const questionNumber = (currentPage - 1) * pageSize + idx + 1;

                      return (
                        <tr
                          key={q.id}
                          onClick={() => setActiveQuestion(q)}
                          className={cn(
                            'hover:bg-slate-50/80 transition-colors cursor-pointer',
                            isActive && 'bg-blue-50/50 font-semibold'
                          )}
                        >
                          {/* Checkbox */}
                          <td
                            className="py-3 px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelectRow(q.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-[#026BFC] focus:ring-[#026BFC] cursor-pointer"
                            />
                          </td>

                          {/* Sequential Question Number */}
                          <td
                            className="py-3 px-2 text-slate-500 font-bold text-center"
                            title={`Database ID: ${q.id}`}
                          >
                            {questionNumber}
                          </td>

                          {/* Question Bengali / English Preview */}
                          <td className="py-3 px-4 max-w-[240px]">
                            <p className="truncate text-slate-900 font-medium">
                              {q.questionBengaliText || q.questionText}
                            </p>
                          </td>

                          {/* Mode Badge */}
                          <td className="py-3 px-3">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight',
                                isExamMode
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              )}
                            >
                              {isExamMode ? 'Exam' : 'Subject'}
                            </span>
                          </td>

                          {/* Exam / Subject */}
                          <td className="py-3 px-3 text-slate-700">
                            {isExamMode ? q.sourceExam || '—' : q.subjectName || '—'}
                          </td>

                          {/* Topic */}
                          <td className="py-3 px-3 text-slate-600">
                            {q.topicName || q.chapterName || '—'}
                          </td>

                          {/* Type Badge */}
                          <td className="py-3 px-2">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold',
                                q.questionType === 'PYQ' || q.sourceType === 'pyq'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-sky-100 text-sky-700'
                              )}
                            >
                              {q.questionType === 'PYQ' || q.sourceType === 'pyq' ? 'PYQ' : 'Topic'}
                            </span>
                          </td>

                          {/* Year */}
                          <td className="py-3 px-2 text-slate-500">
                            {q.sourceYear ? q.sourceYear : '-'}
                          </td>

                          {/* Source */}
                          <td className="py-3 px-3 text-slate-600">
                            {q.sourceType === 'pyq' ? 'Official PYQ' : 'Original'}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-bold inline-block',
                                (q.status === 'published' || q.status === 'active') &&
                                  'bg-emerald-100 text-emerald-700',
                                q.status === 'under_review' &&
                                  'bg-amber-100 text-amber-700',
                                q.status === 'draft' &&
                                  'bg-slate-100 text-slate-600'
                              )}
                            >
                              {q.status === 'published' || q.status === 'active'
                                ? 'Published'
                                : q.status === 'under_review'
                                  ? 'Under Review'
                                  : 'Draft'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td
                            className="py-3 px-3 text-center relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId(
                                    activeActionMenuId === q.id ? null : q.id
                                  );
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {activeActionMenuId === q.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 text-left animate-in fade-in"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveQuestion(q);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Edit2 className="w-3 h-3 text-blue-500" />
                                    <span>Edit Details</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const dup: Question = {
                                        ...q,
                                        id: String(Math.floor(10000 + Math.random() * 90000)),
                                      };
                                      setQuestions([dup, ...questions]);
                                      setActiveQuestion(dup);
                                      setActiveActionMenuId(null);
                                      showToast(`Created duplicate question #${dup.id}.`);
                                    }}
                                    className="w-full px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3 text-purple-500" />
                                    <span>Duplicate</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        q.questionBengaliText || q.questionText
                                      );
                                      setActiveActionMenuId(null);
                                      showToast('Question text copied to clipboard.');
                                    }}
                                    className="w-full px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <FileText className="w-3 h-3 text-slate-400" />
                                    <span>Copy Text</span>
                                  </button>
                                  <div className="border-t border-slate-100 my-1" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuestions(questions.filter((item) => item.id !== q.id));
                                      if (activeQuestion?.id === q.id) setActiveQuestion(null);
                                      setActiveActionMenuId(null);
                                      showToast(`Deleted question #${q.id}.`);
                                    }}
                                    className="w-full px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-500" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200/80 text-xs gap-3">
              <span className="font-semibold text-slate-500">
                Showing{' '}
                {filteredQuestions.length === 0
                  ? 0
                  : (currentPage - 1) * pageSize + 1}
                –{Math.min(filteredQuestions.length, currentPage * pageSize)} of{' '}
                {stats.total.toLocaleString('en-IN')} questions
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {[1, 2, 3, 4, 5].map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'w-7 h-7 rounded-lg font-bold text-xs transition-colors cursor-pointer',
                      currentPage === pageNum
                        ? 'bg-[#026BFC] text-white shadow-2xs'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {pageNum}
                  </button>
                ))}

                <span className="text-slate-400">...</span>

                <button
                  type="button"
                  onClick={() => setCurrentPage(1243)}
                  className="px-2 h-7 rounded-lg border border-slate-200 font-bold text-slate-700 cursor-pointer hover:bg-slate-50"
                >
                  1,243
                </button>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Page Size Select */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="ml-2 bg-[#F8FAFC] border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: QUESTION DETAILS DRAWER (Matching media_1791132993733.jpg) */}
        {activeQuestion && (
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden animate-in slide-in-from-right-4">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Question Details
                </h3>
                <span
                  className="text-[10px] font-mono text-slate-400 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  title={`Click to copy database ID: ${activeQuestion.id}`}
                  onClick={() => {
                    navigator.clipboard.writeText(activeQuestion.id);
                    showToast('Question ID copied to clipboard');
                  }}
                >
                  #{activeQuestion.id.slice(0, 8)}…
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveQuestion(null);
                }}
                title="Close Details"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Tabs: Details, Explanation, History */}
            <div className="flex items-center border-b border-slate-100 px-4 text-xs font-bold text-slate-500">
              {(['details', 'explanation', 'history'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setDrawerTab(tab)}
                  className={cn(
                    'py-2.5 px-3 border-b-2 transition-all capitalize whitespace-nowrap cursor-pointer',
                    drawerTab === tab
                      ? 'border-[#026BFC] text-[#026BFC]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* DRAWER TAB 1: DETAILS */}
            {drawerTab === 'details' && (
              <div className="p-4 space-y-4">
                {/* Question (Bengali) Box */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Question (Bengali)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('drawer-bengali-textarea');
                        el?.focus();
                        showToast('Focusing Bengali question field.');
                      }}
                      className="text-[11px] font-bold text-[#026BFC] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                  <textarea
                    id="drawer-bengali-textarea"
                    rows={2}
                    value={drawerBengaliText}
                    onChange={(e) => setDrawerBengaliText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#026BFC] resize-none"
                  />
                </div>

                {/* Options Box with Shuffle & Add Option */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Options
                    </label>
                    <button
                      type="button"
                      onClick={handleShuffleDrawerOptions}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Shuffle className="w-3 h-3" /> Shuffle Options
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                      const isCorrect = drawerCorrectOption === optKey;
                      return (
                        <div
                          key={optKey}
                          onClick={() => setDrawerCorrectOption(optKey)}
                          className={cn(
                            'flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer',
                            isCorrect
                              ? 'bg-emerald-50/70 border-emerald-500 text-emerald-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                          )}
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                            <span
                              className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              )}
                            >
                              {optKey}
                            </span>
                            <input
                              type="text"
                              value={drawerOptions[optKey] || ''}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setDrawerOptions({
                                  ...drawerOptions,
                                  [optKey]: e.target.value,
                                })
                              }
                              className="w-full bg-transparent border-none text-xs font-medium focus:outline-none focus:underline"
                            />
                          </div>

                          {isCorrect && (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      showToast('Option fields are fully editable above.');
                    }}
                    className="w-full mt-2 py-2 text-center text-xs font-bold text-[#026BFC] hover:underline cursor-pointer"
                  >
                    + Add Option
                  </button>
                </div>

                {/* 2-Column Metadata Grid matching reference image */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Upload Mode
                    </label>
                    <select
                      value={drawerUploadMode}
                      onChange={(e) => setDrawerUploadMode(e.target.value as UploadMode)}
                      className="w-full p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="exam">By Exam</option>
                      <option value="subject">By Subject</option>
                    </select>
                  </div>

                  {drawerUploadMode === 'exam' ? (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Exam
                      </label>
                      <select
                        value={drawerExam}
                        onChange={(e) => setDrawerExam(e.target.value)}
                        className="w-full p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold cursor-pointer"
                      >
                        <option value="WBP Constable">WBP Constable</option>
                        <option value="WBSSC Group C">WBSSC Group C</option>
                        <option value="WBSSC Group D">WBSSC Group D</option>
                        <option value="Railway NTPC">Railway NTPC</option>
                        <option value="ICDS">ICDS</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Subject
                      </label>
                      <select
                        value={drawerSubject}
                        onChange={(e) => setDrawerSubject(e.target.value)}
                        className="w-full p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold cursor-pointer"
                      >
                        <option value="History">History</option>
                        <option value="General Science">General Science</option>
                        <option value="Indian Polity">Indian Polity</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Geography">Geography</option>
                      </select>
                    </div>
                  )}

                  {drawerUploadMode === 'exam' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Subject
                      </label>
                      <select
                        value={drawerSubject}
                        onChange={(e) => setDrawerSubject(e.target.value)}
                        className="w-full p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold cursor-pointer"
                      >
                        <option value="History">History</option>
                        <option value="General Science">General Science</option>
                        <option value="Indian Polity">Indian Polity</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Geography">Geography</option>
                        <option value="Economy">Economy</option>
                        <option value="Static GK">Static GK</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Topic
                    </label>
                    <select
                      value={drawerTopic}
                      onChange={(e) => setDrawerTopic(e.target.value)}
                      className="w-full p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="Modern India">Modern India</option>
                      <option value="Chemical Reactions">Chemical Reactions</option>
                      <option value="Constitution">Constitution</option>
                      <option value="BODMAS">BODMAS</option>
                      <option value="Rivers of India">Rivers of India</option>
                      <option value="Indian Economy">Indian Economy</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Human Body">Human Body</option>
                      <option value="National Symbols">National Symbols</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Question Type
                    </label>
                    <select
                      value={drawerType}
                      onChange={(e) => setDrawerType(e.target.value)}
                      className="w-full p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="PYQ">PYQ</option>
                      <option value="Full Mock">Full Mock</option>
                      <option value="Topic">Topic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Year
                    </label>
                    <select
                      value={drawerYear}
                      onChange={(e) => setDrawerYear(e.target.value)}
                      className="w-full p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Source
                    </label>
                    <select
                      value={drawerSource}
                      onChange={(e) => setDrawerSource(e.target.value)}
                      className="w-full p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="Official PYQ">Official PYQ</option>
                      <option value="Original">Original</option>
                      <option value="Reference">Reference</option>
                      <option value="AI-assisted">AI-assisted</option>
                    </select>
                  </div>
                </div>

                {/* Status Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Status
                  </label>
                  <select
                    value={drawerStatus}
                    onChange={(e) => setDrawerStatus(e.target.value as QuestionBankStatus)}
                    className="w-full p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs cursor-pointer"
                  >
                    <option value="published">Published</option>
                    <option value="under_review">Under Review</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Tags Section */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {drawerTags.map((t) => (
                      <span
                        key={t}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => handleRemoveDrawerTag(t)}
                          className="hover:text-rose-500 cursor-pointer"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="New tag..."
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDrawerTag();
                        }
                      }}
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddDrawerTag}
                      className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 shrink-0 hover:bg-slate-200 cursor-pointer"
                    >
                      + Add Tag
                    </button>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteActiveQuestion}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>

                  <button
                    type="button"
                    disabled={isUpdatingDrawer}
                    onClick={handleUpdateDrawer}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {isUpdatingDrawer ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Update Question</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* DRAWER TAB 2: EXPLANATION */}
            {drawerTab === 'explanation' && (
              <div className="p-4 space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                    Comprehensive Explanation (Bengali & English)
                  </label>
                  <textarea
                    rows={8}
                    value={editExplanation}
                    onChange={(e) => setEditExplanation(e.target.value)}
                    placeholder="Enter detailed explanation of why the correct option is right..."
                    className="w-full p-3 rounded-xl border border-slate-200 bg-[#F8FAFC] font-medium text-slate-900 focus:outline-none focus:border-[#026BFC] resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleUpdateDrawer}
                    className="px-4 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white font-bold cursor-pointer"
                  >
                    Save Explanation
                  </button>
                </div>
              </div>
            )}


            {/* DRAWER TAB 4: HISTORY */}
            {drawerTab === 'history' && (
              <div className="p-4 space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <p className="font-bold text-slate-900">Author & Audit Trail</p>
                  <p className="text-slate-500">
                    Created By: <span className="font-semibold text-slate-800">Super Admin</span>
                  </p>
                  <p className="text-slate-500">
                    Last Updated: <span className="font-semibold text-slate-800">2026-09-15 11:05</span>
                  </p>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Version History
                  </h4>
                  <div className="space-y-2.5">
                    {(activeQuestion.versionHistory || [
                      {
                        version: 1,
                        editedBy: 'Super Admin',
                        editedAt: '2026-09-10 10:00',
                        changes: 'Initial question creation',
                      },
                    ]).map((vh) => (
                      <div
                        key={vh.version}
                        className="p-3 rounded-xl border border-slate-200 bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#026BFC]">Version {vh.version}</span>
                          <span className="text-[10px] text-slate-400">{vh.editedAt}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 mt-1">
                          {vh.changes}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">By {vh.editedBy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. ADD QUESTION MODAL (BY EXAM VS BY SUBJECT) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center text-white',
                    modalUploadMode === 'exam' ? 'bg-[#026BFC]' : 'bg-purple-600'
                  )}
                >
                  {modalUploadMode === 'exam' ? (
                    <Shield className="w-5 h-5" />
                  ) : (
                    <BookOpen className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Add Question — {modalUploadMode === 'exam' ? 'By Exam' : 'By Subject'}
                  </h3>
                  <p className="text-xs font-medium text-slate-400">
                    {modalUploadMode === 'exam'
                      ? 'For Full Mock Tests & Official PYQs (Exam specific)'
                      : 'For Topic Tests & Practice (Subject & Topic hierarchy)'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Duplicate Warning Alert */}
            {duplicateWarning && (
              <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-amber-900">
                    Possible duplicate detected ({duplicateWarning.similarity}% similarity)
                  </p>
                  <p className="text-amber-800 mt-0.5 line-clamp-2">
                    &quot;{duplicateWarning.existingText}&quot;
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setDuplicateWarning(null)}
                      className="px-2.5 py-1 bg-amber-200 text-amber-900 rounded-md font-bold text-[11px] cursor-pointer"
                    >
                      Keep Both
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-2.5 py-1 bg-slate-200 text-slate-800 rounded-md font-bold text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateQuestionSubmit} className="space-y-4 mt-4 text-xs">
              {/* BY EXAM FIELDS */}
              {modalUploadMode === 'exam' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Exam *
                    </label>
                    <select
                      value={addExam}
                      onChange={(e) => setAddExam(e.target.value)}
                      required
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="WBP Constable">WBP Constable</option>
                      <option value="WBSSC Group C">WBSSC Group C</option>
                      <option value="WBSSC Group D">WBSSC Group D</option>
                      <option value="Railway NTPC">Railway NTPC</option>
                      <option value="ICDS">ICDS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Question Type *
                    </label>
                    <select
                      value={addExamQuestionType}
                      onChange={(e) =>
                        setAddExamQuestionType(e.target.value as 'Full Mock' | 'Official PYQ')
                      }
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="Official PYQ">Official PYQ</option>
                      <option value="Full Mock">Full Mock</option>
                    </select>
                  </div>

                  {addExamQuestionType === 'Official PYQ' && (
                    <>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Year
                        </label>
                        <select
                          value={addYear}
                          onChange={(e) => setAddYear(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold cursor-pointer"
                        >
                          <option value="2026">2026</option>
                          <option value="2025">2025</option>
                          <option value="2024">2024</option>
                          <option value="2023">2023</option>
                          <option value="2022">2022</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Paper / Set
                        </label>
                        <input
                          type="text"
                          value={addPaper}
                          onChange={(e) => setAddPaper(e.target.value)}
                          placeholder="e.g. Set A or Preliminary"
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Section / Subject (Optional)
                    </label>
                    <input
                      type="text"
                      value={addSection}
                      onChange={(e) => setAddSection(e.target.value)}
                      placeholder="e.g. General Awareness, Math"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>
                </div>
              ) : (
                /* BY SUBJECT FIELDS */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Subject *
                    </label>
                    <select
                      value={addSubject}
                      onChange={(e) => setAddSubject(e.target.value)}
                      required
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="General Science">General Science</option>
                      <option value="History">History</option>
                      <option value="Indian Polity">Indian Polity</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Geography">Geography</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Topic *
                    </label>
                    <input
                      type="text"
                      value={addTopic}
                      onChange={(e) => setAddTopic(e.target.value)}
                      required
                      placeholder="e.g. Heat & Temperature"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Subtopic (Optional)
                    </label>
                    <input
                      type="text"
                      value={addSubtopic}
                      onChange={(e) => setAddSubtopic(e.target.value)}
                      placeholder="e.g. Thermodynamics"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Question Text */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Question (Bengali / English) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={addQuestionBengali}
                  onChange={(e) => {
                    setAddQuestionBengali(e.target.value);
                    checkDuplicate(e.target.value);
                  }}
                  placeholder="যেমন: ভারতের প্রথম গভর্নর-জেনারেল কে ছিলেন?"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-none focus:border-[#026BFC] resize-none"
                />
              </div>

              {/* Options A, B, C, D */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const val =
                    opt === 'A'
                      ? addOptA
                      : opt === 'B'
                        ? addOptB
                        : opt === 'C'
                          ? addOptC
                          : addOptD;
                  const setVal =
                    opt === 'A'
                      ? setAddOptA
                      : opt === 'B'
                        ? setAddOptB
                        : opt === 'C'
                          ? setAddOptC
                          : setAddOptD;

                  return (
                    <div key={opt} className="relative">
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="radio"
                          name="correct_opt"
                          checked={addCorrect === opt}
                          onChange={() => setAddCorrect(opt)}
                          id={`radio_${opt}`}
                          className="text-[#026BFC] focus:ring-[#026BFC] cursor-pointer"
                        />
                        <label
                          htmlFor={`radio_${opt}`}
                          className="font-bold text-slate-700 cursor-pointer"
                        >
                          Option {opt} {addCorrect === opt && '(Correct Answer)'}
                        </label>
                      </div>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        placeholder={`Option ${opt} text`}
                        className="w-full p-2 rounded-xl border border-slate-200 bg-white font-semibold"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Comprehensive Explanation */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Explanation
                </label>
                <textarea
                  rows={3}
                  value={addExplanation}
                  onChange={(e) => setAddExplanation(e.target.value)}
                  placeholder="Concise explanation of the correct answer..."
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white resize-none"
                />
              </div>

              {/* Marks, Negative Marks & Source */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Marks (+ve)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={addMarks}
                    onChange={(e) => setAddMarks(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Negative Marks (-ve)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={addNegativeMarks}
                    onChange={(e) => setAddNegativeMarks(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Source
                  </label>
                  <select
                    value={addSource}
                    onChange={(e) => setAddSource(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold cursor-pointer"
                  >
                    <option value="Official PYQ">Official PYQ</option>
                    <option value="Original">Original</option>
                    <option value="Reference Book">Reference Book</option>
                    <option value="Mock Test Series">Mock Test Series</option>
                  </select>
                </div>
              </div>

              {/* Tags & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tags (Press Enter to add)
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-slate-200 bg-white min-h-[42px]">
                    {addTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-bold text-slate-700"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => setAddTags(addTags.filter((t) => t !== tag))}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={addTagInput}
                      onChange={(e) => setAddTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (addTagInput.trim() && !addTags.includes(addTagInput.trim())) {
                            setAddTags([...addTags, addTagInput.trim()]);
                            setAddTagInput('');
                          }
                        }
                      }}
                      placeholder="Add tag and press Enter..."
                      className="text-xs bg-transparent border-none focus:outline-none flex-1 min-w-[120px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value as QuestionBankStatus)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold cursor-pointer"
                  >
                    <option value="published">Published</option>
                    <option value="under_review">Under Review</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-6 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white font-bold cursor-pointer shadow-xs"
                >
                  {isSubmittingAdd ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. BULK IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#026BFC]" />
                Import Questions (Bulk CSV)
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Select Upload Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                1. Select Upload Mode:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setImportMode('exam')}
                  className={cn(
                    'p-3 rounded-2xl border text-left transition-all cursor-pointer',
                    importMode === 'exam'
                      ? 'bg-blue-50 border-[#026BFC] text-[#026BFC] font-bold'
                      : 'border-slate-200 font-semibold text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <p className="text-xs">By Exam</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Full Mocks & PYQs</p>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('subject')}
                  className={cn(
                    'p-3 rounded-2xl border text-left transition-all cursor-pointer',
                    importMode === 'subject'
                      ? 'bg-purple-50 border-purple-500 text-purple-600 font-bold'
                      : 'border-slate-200 font-semibold text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <p className="text-xs">By Subject</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Topic Tests</p>
                </button>
              </div>
            </div>

            {/* Step 2: File Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  2. Upload CSV File:
                </label>
                <button
                  type="button"
                  onClick={() => downloadTemplate(importMode)}
                  className="text-[11px] font-bold text-[#026BFC] hover:underline cursor-pointer"
                >
                  Download {importMode === 'exam' ? 'Exam' : 'Subject'} Template
                </button>
              </div>

              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center bg-slate-50 relative">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">
                  {importFile ? importFile.name : 'Choose CSV file (.csv)'}
                </p>
                <input
                  type="file"
                  accept=".csv, .txt"
                  onChange={handleFileChange}
                  className="mt-2 text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold cursor-pointer"
                />
              </div>
            </div>

            {/* Step 3: Validation Preview */}
            {importPreviewStats && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <p className="font-bold text-slate-900">Validation Preview</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-white border">
                    <p className="text-[10px] text-slate-400">Total Rows</p>
                    <p className="text-sm font-bold text-slate-800">{importPreviewStats.total}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700">
                    <p className="text-[10px]">Valid</p>
                    <p className="text-sm font-bold">{importPreviewStats.valid}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-700">
                    <p className="text-[10px]">Errors</p>
                    <p className="text-sm font-bold">{importPreviewStats.errors}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-700">
                    <p className="text-[10px]">Duplicates</p>
                    <p className="text-sm font-bold">{importPreviewStats.duplicates}</p>
                  </div>
                </div>

                {importPreviewStats.errorList.length > 0 && (
                  <div className="mt-2 text-[11px] text-rose-600 space-y-1">
                    {importPreviewStats.errorList.map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!importPreviewStats || importPreviewStats.valid === 0 || isImporting}
                onClick={handleExecuteImport}
                className="px-5 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-bold disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {isImporting
                  ? 'Importing...'
                  : `Import Valid Questions (${importPreviewStats?.valid || 0})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
