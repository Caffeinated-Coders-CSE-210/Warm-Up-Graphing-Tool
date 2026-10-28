# Usability Study Results

## Test Environment

- Application commit: `3895343`
- Browser: `Google Chrome 154.0.8037.59`
- Operating system: macOS
- Test date: October 27, 2026
- Number of participants: 3

## Test Data

The following CSV was used for all participant sessions:

```text
x,y
1,1
10,100
100,10
```

## Study Procedure

Each participant was asked to complete the same five tasks without being told which controls to use.

For each task, the result was recorded as:

- **Independent** — completed without help.
- **With help** — completed after receiving assistance or a hint.
- **Not completed** — participant was unable to complete the task.

Participants are identified anonymously as P1, P2, and P3.

## Participant Background

| Participant | Familiarity with CSV Files | Familiarity with Logarithmic Scales |
| --- | --- | --- |
| P1 | familiar | familiar |
| P2 | familiar | little |
| P3 | familiar | familiar|

## Tasks

1. Import the supplied CSV.
2. Find the Y value corresponding to X = 10.
3. Display X on a logarithmic scale.
4. Begin deleting `(10,100)`, then cancel so the point remains.
5. Download the line chart as a PNG.

## Task Results

| Participant | Import CSV | Find Y at X = 10 | Set X to Log Scale | Cancel Point Deletion | Export Line Chart as PNG |
| --- | --- | --- | --- | --- | --- |
| P1 | Independent | Independent | Independent | Independent | Independent |
| P2 | Independent | Independent | Independent | Independent | Independent |
| P3 | Independent | Independent | Independent |Independent  | Independent |

## Participant Observations

### P1

- **Task 1:** Completed independently; successfully imported csv.
- **Task 2:** Completed independently; Y = 100 was correctly identified.
- **Task 3:** Completed independently; successfully switched to a logarithmic scale.
- **Task 4:** Completed independently; deletion was canceled and the point remained on both graphs.
- **Task 5:** Completed independently; successfully downloaded the chart.
- **Other observations:** This participant completed all given tasks without hesitation or assistance/hints from others.

### P2

- **Task 1:** Completed independently.
- **Task 2:** Completed independently; correctly identified Y = 100.
- **Task 3:** Completed independently.
- **Task 4:** Completed independently; deletion was canceled and the point remained.
- **Task 5:** Completed independently.
- **Other observations:** The participant completed all five tasks without hesitation or assistance despite having little familiarity with logarithmic scales.

### P3

- **Task 1:** Completed independently
- **Task 2:** Completed independently; but struggled with seemingly arbitrary scaling on the x-axis
- **Task 3:** Completed independently
- **Task 4:** Completed independently; but hesitated figuring out how to delete a point
- **Task 5:** Completed independently
- **Other observations:** Completed all five tasks independently. The participant had some difficulty interpreting the X-axis scaling and briefly hesitated when locating how to delete a point.

## Overall Observations

Summarize patterns across the three participants here.

- All participants were able to complete the five requested tasks independently.
- Limited familiarity with logarithmic scales did not prevent successful completion of the scale task.
- One participant had some difficulty interpreting the X-axis scaling while trying to find the value at X = 10.
- One participant briefly hesitated while figuring out how to delete a point.

## Observed Problems

List usability problems that were observed during the sessions.

- One participant had some difficulty interpreting the X-axis scaling while finding the value at X = 10.
- One participant briefly hesitated while figuring out how to delete a point.
- No recurring usability problems were observed across all three participants.

## Proposed Improvements

List possible improvements separately from the observed problems.

- No changes are recommended at this time because all participants were able to complete all five tasks independently.
- The observed difficulties were limited to individual participants and did not prevent task completion.

## Summary

The study evaluated whether users could import data, inspect a plotted value, change the X-axis to a logarithmic scale, cancel a point deletion, and export the line chart as a PNG.

Overall, all three participants were able to complete the requested usability tasks independently without hints from others.
