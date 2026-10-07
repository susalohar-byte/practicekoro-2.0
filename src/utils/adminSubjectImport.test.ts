import {describe,it,expect} from 'vitest';
import {parseSubjectImport,subjectCsvTemplate} from './adminSubjectImport';
describe('Subject file import validation',()=>{
 it('reads a real template and defaults omitted publish state to Draft',()=>{expect(parseSubjectImport(subjectCsvTemplate,'template.csv')[0]).toMatchObject({name:'Example Subject',isActive:false});expect(parseSubjectImport('[{"name":"Math","slug":"math"}]','subjects.json',5)[0].orderIndex).toBe(5)});
 it('parses quoted commas, multiline fields and escaped quotes',()=>{expect(parseSubjectImport('name,slug,description\nMath,math,"A, B\nC ""quoted"""\n','subjects.csv')[0].description).toBe('A, B\nC "quoted"')});
 it.each(['[{"name":"Math","slug":"math","id":"fake"}]','[{"name":"Math","slug":"math","isActive":"yes"}]','[{"name":"Math","slug":"math","orderIndex":-1}]','[{"name":"Math","slug":"math"},{"name":"Copy","slug":"math"}]','{}'])('rejects invalid/duplicate/unsupported JSON without writes',text=>{expect(()=>parseSubjectImport(text,'subjects.json')).toThrow()});
 it('rejects unclosed quotes, unknown extensions and excess rows',()=>{expect(()=>parseSubjectImport('name,slug\n"Math,math','subjects.csv')).toThrow();expect(()=>parseSubjectImport('bad','subjects.txt')).toThrow();expect(()=>parseSubjectImport(JSON.stringify(Array.from({length:101},(_,i)=>({name:`S${i}`,slug:`s${i}`}))),'s.json')).toThrow()});
});
