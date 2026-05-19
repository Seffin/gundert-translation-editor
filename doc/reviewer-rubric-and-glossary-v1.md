# Reviewer Rubric and Glossary Starter (v1)

## Objective

Define review quality standards and a starter glossary for Sprint 1 acceptance testing.

## Rubric Status

- Status: Ready for facilitator review and translation
- Owner: Translation facilitator (ben)
- Reviewers: ben & seffin
- Effective date: 5th May 2026
- Next step: Fill in preferred translations for Spanish, Hindi, Malayalam; validate rubric on smoke stories 29, 35, 38

## Quality Dimensions

Use a 1-5 scale per segment.

| Dimension               | 1 (Poor)                        | 3 (Acceptable)                        | 5 (Excellent)                                   |
| ----------------------- | ------------------------------- | ------------------------------------- | ----------------------------------------------- |
| Meaning fidelity        | Meaning is distorted or missing | Core meaning mostly preserved         | Meaning preserved accurately with no distortion |
| Naturalness             | Awkward or unnatural phrasing   | Understandable with minor awkwardness | Natural, fluent, and context-appropriate        |
| Terminology consistency | Key terms inconsistent          | Mostly consistent with minor drift    | Fully consistent with approved glossary         |
| Readability             | Hard to read and follow         | Generally readable                    | Clear and easy to read for target audience      |

## Reject Thresholds

1. Any segment with a score of 1 in any dimension is reject
2. Two or more dimensions scored 2 is reject
3. Terminology inconsistency on key terms is reject until resolved

## Workflow Blocking Rule

A story cannot move to Approved when unresolved reviewer comments exist.

## Glossary Starter List

| Term             | Preferred Translation                                                                    | Avoid                                                  | Rationale                                        | Scope    |
| ---------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------ | -------- |
| Jesus            | ES: Jesús / HI: यीशु (Yīśu) / ML: യേശു (Yēśu)                                            | Avoid transliteration without context                  | Central character across all smoke stories (18x) | Global   |
| disciples        | ES: discípulos / HI: शिष्य (Śiṣya) / ML: ശിഷ്യന്മാര്‍ (Śiṣyanmar)                        | learners, students, followers (if conflicting)         | Core group, repeated 9x in smoke set             | Global   |
| servant/servants | ES: siervo/siervos / HI: सेवक (sevak) / ML: ദാസൻ/ദാസര്‍ (dāsar)                          | slave (unless culturally appropriate)                  | Repeated 12x in story 29 (Unmerciful Servant)    | Global   |
| king             | ES: rey / HI: राजा (rājā) / ML: രാജാവ് (rājāv)                                           | ruler (too generic), monarch                           | Repeated 5x in story 29                          | Global   |
| forgive          | ES: perdonar / HI: क्षमा करना (kṣamā karnā) / ML: ക്ഷമിക്കുക                             | pardon (if weaker in target language)                  | Core theme story 29, repeated 3x                 | Global   |
| betray           | ES: traicionar / HI: विश्वासघात करना (viśvāsaghat karnā) / ML: ഒറ്റുക                    | deceive (too weak), hand over                          | Core theme story 38, repeated 3x                 | Global   |
| God              | ES: Dios / HI: ईश्वर (Īśvar) / ML: ദൈവം (daivam)                                         | divine being (too generic)                             | Theological anchor, repeated 3x                  | Global   |
| Judas            | ES: Judas / HI: यहूदा (Yahūdā) / ML: യൂദാസ് (Yūdās)                                      | N/A                                                    | Key character story 38                           | Global   |
| Peter            | ES: Pedro / HI: पतरस (Patras) / ML: പത്രോസ് (Patros)                                     | N/A                                                    | Key character story 38                           | Global   |
| Jewish leaders   | ES: líderes judíos / HI: यहूदी नेता (yahūdī netā) / ML: യെഹൂദ നേതൃത്വം (Yehūda netṛtvam) | Avoid: scribes/Pharisees (unless part of OBS glossary) | Story 38 context, repeated 4x                    | Story 38 |
| sins             | ES: pecados / HI: पाप (pāp) / ML: പാപങ്ങൾ (pāpangal)                                     | wrongdoing (if weaker), transgressions                 | Theological, repeated 3x                         | Global   |
| Passover         | ES: Pascua / HI: फसह (Faśah) / ML: പെസഹ                                                  | Festival of Unleavened Bread (alternative)             | Cultural/theological anchor story 38             | Story 38 |

## Glossary Entry Rules

1. Each entry must include rationale
2. Preferred term must be script-correct for target language
3. If term is unresolved, mark as Open and block approval for impacted stories

## Rubric Validation (Required before approval)

Use this section to record sample segment scoring from the three smoke stories to test reject thresholds.

### Story 29 Sample Validation

Sample segment: [e.g., "The servant fell on his knees before the king..."]  
Meaning fidelity: [1-5]  
Naturalness: [1-5]  
Terminology consistency: [1-5]  
Readability: [1-5]  
Reject decision: Pass / Fail  
Notes:

### Story 35 Sample Validation

Sample segment: [e.g., "...his father saw him and felt compassion for him..."]  
Meaning fidelity: [1-5]  
Naturalness: [1-5]  
Terminology consistency: [1-5]  
Readability: [1-5]  
Reject decision: Pass / Fail  
Notes:

### Story 38 Sample Validation

Sample segment: [e.g., "Judas came to Jesus and said, Greetings, Teacher, and kissed him..."]  
Meaning fidelity: [1-5]  
Naturalness: [1-5]  
Terminology consistency: [1-5]  
Readability: [1-5]  
Reject decision: Pass / Fail  
Notes:

### Validation Summary

- Reject thresholds tested: [Yes/No]
- Threshold adjustments needed: [None / describe]
- Glossary ready for use: [Yes/No]
- Facilitator approval: [Pending]

## Exit Criteria

1. Rubric validated on 3 smoke stories
2. Glossary contains enough key terms for consistency checks
3. Rubric and glossary decisions encoded in oddkit log
