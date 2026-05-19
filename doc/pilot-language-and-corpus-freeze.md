# Pilot Language and OBS Corpus Freeze

## Objective

Finalize 3 pilot language pairs and freeze the OBS sample corpus used for MVP validation.

## Decision Status

- Status: In progress
- Owner: Translation facilitator
- Contributors: Developer 1, Developer 2
- Target date: TBD

## Pilot Language Pair Candidates

Use this table to decide one Latin-script pair and two Indic-script pairs.

| Pair ID | Source Language   | Target Language | Script | Rationale                                  | Decision |
| ------- | ----------------- | --------------- | ------ | ------------------------------------------ | -------- |
| P1      | English (Gateway) | Spanish         | Latin  | Baseline pilot for workflow speed and QA   | Approved |
| P2      | English (Gateway) | Hindi           | Indic  | Script complexity and punctuation behavior | Approved |
| P3      | English (Gateway) | Malayalam       | Indic  | Second Indic validation for robustness     | Approved |

## Selection Criteria

1. Active team availability for weekly usage
2. Real OBS translation demand in pilot period
3. Coverage of narrative and terminology challenges
4. Ability to provide reviewer feedback consistently

## OBS Corpus Freeze

### Smoke set (fast iteration)

- Story count: 3
- Selected stories: 29 (Unmerciful Servant), 35 (Compassionate Father), 38 (Jesus Is Betrayed)
- Rationale: High dialogue density, repeated key terms (debt, forgiveness, serve), emotional tone shifts, mirrored phrasing patterns

### Baseline set (pilot measurement)

- Story count: 10
- Selected stories: 10, 23, 27, 29, 35, 37, 38, 39, 47, 49
- Rationale: Mixed OT/NT coverage, strong terminology consistency pressure, high dialogue stress, naturalness variation

## Corpus Selection Rules

1. Include at least one story with dense dialogue
2. Include at least one story with repeated key terms
3. Include at least one story known to trigger naturalness issues
4. Keep source segmentation stable for before/after comparison

## Approval Record

- Facilitator approval: Pending (awaiting facilitator review and sign-off)
- Date: TBD
- Notes: Candidates selected based on dialogue-marker density analysis and terminology stress patterns from en_obs corpus

## Exit Criteria

1. Exactly 3 pairs selected and approved
2. Smoke set and baseline set frozen
3. Pair and corpus decisions encoded in oddkit session log
