import { describe, it, expect } from 'vitest';
import {
  questionSlug,
  questionPageUrl,
  questionPageTitle,
  questionPageDescription,
  generateQAPageJsonLd,
  generateBreadcrumbJsonLd,
  generateFAQPageJsonLd,
  generateOrganizationJsonLd,
} from './seo';
import type { Question } from '@/types';

const mockQuestion: Question = {
  id: 'q-001',
  questionText: 'Who gave the first sermon at Sarnath?',
  questionBengaliText: 'গৌতম বুদ্ধ সারনাথে তাঁর প্রথম ধর্মোপদেশ ______ দ্বারা প্রদান করেছিলেন',
  optionA: 'ধম্ম-চক্ক-প্রবর্তন মুদ্রা',
  optionB: 'বৈশালী',
  optionC: 'কুশীনগর',
  optionD: 'লুম্বিনী',
  correctOption: 'A',
  explanation: 'Gautam Buddha gave his first sermon at Sarnath.',
  explanationBengali: 'গৌতম বুদ্ধ সারনাথে তাঁর প্রথম ধর্মোপদেশ ধম্ম-চক্ক-প্রবর্তন মুদ্রা দ্বারা প্রদান করেছিলেন।',
  difficulty: 'medium',
  defaultMarks: 1,
  defaultNegativeMarks: 0,
  isActive: true,
  subjectId: 'sub-history',
  subjectName: 'Ancient History',
  chapterName: 'Buddhism',
  topicName: 'Buddhism',
};

describe('seo utilities', () => {
  describe('questionSlug', () => {
    it('converts Bengali text to a URL-safe slug', () => {
      const slug = questionSlug('গৌতম বুদ্ধ সারনাথে তাঁর প্রথম ধর্মোপদেশ');
      expect(slug).toBe('গৌতম-বুদ্ধ-সারনাথে-তাঁর-প্রথম-ধর্মোপদেশ');
    });

    it('removes URL-unsafe characters', () => {
      const slug = questionSlug('Who is the "best" player?');
      expect(slug).not.toContain('"');
      expect(slug).not.toContain('?');
    });

    it('collapses multiple hyphens', () => {
      const slug = questionSlug('hello   world');
      expect(slug).toBe('hello-world');
    });

    it('truncates to 120 chars', () => {
      const longText = 'a'.repeat(200);
      expect(questionSlug(longText).length).toBeLessThanOrEqual(120);
    });
  });

  describe('questionPageUrl', () => {
    it('generates canonical URL', () => {
      const url = questionPageUrl('q-001', 'গৌতম বুদ্ধ');
      expect(url).toBe('https://practicekoro.online/questions/q-001/গৌতম-বুদ্ধ');
    });
  });

  describe('questionPageTitle', () => {
    it('generates [Solved] title like Testbook', () => {
      const title = questionPageTitle(mockQuestion);
      expect(title).toContain('[Solved]');
      expect(title).toContain('PracticeKoro');
      expect(title).toContain('গৌতম বুদ্ধ');
    });

    it('truncates long titles', () => {
      const longQ = { ...mockQuestion, questionBengaliText: 'a'.repeat(200) };
      const title = questionPageTitle(longQ);
      expect(title.length).toBeLessThan(200);
    });
  });

  describe('questionPageDescription', () => {
    it('includes the correct answer', () => {
      const desc = questionPageDescription(mockQuestion);
      expect(desc).toContain('ধম্ম-চক্ক-প্রবর্তন মুদ্রা');
      expect(desc).toContain('Top answer');
    });
  });

  describe('generateQAPageJsonLd', () => {
    it('generates valid QAPage schema', () => {
      const jsonLd = generateQAPageJsonLd({
        question: mockQuestion,
        url: 'https://practicekoro.online/questions/q-001/test',
      }) as Record<string, unknown>;

      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('QAPage');
      expect(jsonLd.mainEntity).toBeDefined();

      const mainEntity = jsonLd.mainEntity as Record<string, unknown>;
      expect(mainEntity['@type']).toBe('Question');
      expect(mainEntity.answerCount).toBe(1);
      expect(mainEntity.acceptedAnswer).toBeDefined();

      const answer = mainEntity.acceptedAnswer as Record<string, unknown>;
      expect(answer['@type']).toBe('Answer');
      expect(answer.text).toContain('ধম্ম-চক্ক-প্রবর্তন মুদ্রা');
    });
  });

  describe('generateBreadcrumbJsonLd', () => {
    it('generates valid BreadcrumbList schema', () => {
      const jsonLd = generateBreadcrumbJsonLd([
        { name: 'PracticeKoro', url: 'https://practicekoro.online' },
        { name: 'History', url: 'https://practicekoro.online/test-series' },
      ]) as Record<string, unknown>;

      expect(jsonLd['@type']).toBe('BreadcrumbList');
      const items = jsonLd.itemListElement as Array<Record<string, unknown>>;
      expect(items).toHaveLength(2);
      expect(items[0].position).toBe(1);
      expect(items[1].position).toBe(2);
    });
  });

  describe('generateFAQPageJsonLd', () => {
    it('generates valid FAQPage schema', () => {
      const jsonLd = generateFAQPageJsonLd([
        { questionText: 'Q1?', answer: 'A1' },
        { questionText: 'Q2?', answer: 'A2' },
      ]) as Record<string, unknown>;

      expect(jsonLd['@type']).toBe('FAQPage');
      const entities = jsonLd.mainEntity as Array<Record<string, unknown>>;
      expect(entities).toHaveLength(2);
      expect(entities[0]['@type']).toBe('Question');
    });
  });

  describe('generateOrganizationJsonLd', () => {
    it('generates valid Organization schema', () => {
      const jsonLd = generateOrganizationJsonLd() as Record<string, unknown>;
      expect(jsonLd['@type']).toBe('Organization');
      expect(jsonLd.name).toBe('PracticeKoro');
      expect(jsonLd.url).toBe('https://practicekoro.online');
    });
  });
});
