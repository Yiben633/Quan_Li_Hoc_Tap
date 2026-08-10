import { buildCoachIntentPrompt, buildStudyCoachContextBlock, coachSystemInstruction } from '../src/modules/ai/coach/coachPrompt.js';
import type { StudyCoachContext } from '../src/modules/ai/coach/coach.types.js';

const context: StudyCoachContext = {
  now: '2026-08-10T12:00:00.000Z',
  timezone: 'Asia/Ho_Chi_Minh',
  subjects: [],
  tasks: [],
  plans: [],
  calendar: [],
  goals: [],
  stats: { studyMinutesThisWeek: 0, completedTasksThisWeek: 0 },
};

describe('StudyFlow AI Coach prompt', () => {
  it('keeps the MVP intent set explicit and limited', () => {
    expect(coachSystemInstruction).toContain('question, create_study_plan, create_schedule, reschedule, prioritize_tasks, create_tasks, start_focus, clarify');
    expect(coachSystemInstruction).not.toContain('delete_all_tasks');
  });

  it('places database context in a data-only block', () => {
    const block = buildStudyCoachContextBlock(context);

    expect(block).toContain('<studyflow_context type="data">');
    expect(block).toContain('Asia/Ho_Chi_Minh');
    expect(block).toContain('</studyflow_context>');
  });

  it('separates user input from the system instruction and context', () => {
    const prompt = buildCoachIntentPrompt('Toi muon lap lich Java trong 7 ngay.', context, false);

    expect(prompt).toContain('<user_request type="untrusted_input">');
    expect(prompt).toContain('Toi muon lap lich Java trong 7 ngay.');
    expect(prompt).toContain('Moi thay doi chi la de xuat draft');
  });
});
