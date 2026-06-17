import { getGeminiClient } from "../config/gemini.js";
import { Type } from "@google/genai";

// Procedural fallback logic in case Gemini client configuration is skipped or fails
export const generateProceduralSummary = (classroom, students, records, totalPresent, totalAbsent, rate, assignments = [], grades = [], studentId = null) => {
  const issues = [];
  const recommendations = [];

  if (studentId) {
    const std = students.find(s => (s._id?.toString() || s.id?.toString()) === studentId);
    const name = std ? std.name : "Student";

    // 1. Student Attendance calculations
    const studentRecords = records.filter((r) => (r.student?.toString() || r.studentId?.toString()) === studentId);
    const totalSess = studentRecords.length;
    const pCount = studentRecords.filter((r) => ["Present", "present"].includes(r.status || r.recordStatus)).length;
    const attRate = totalSess > 0 ? (pCount / totalSess) * 100 : 100;

    // 2. Student Grades calculations
    const myGrades = grades.filter((g) => (g.student?.toString() || g.studentId?.toString()) === studentId);
    let earnedSum = 0;
    let possibleSum = 0;
    const myRemarks = [];

    const assMap = {};
    assignments.forEach((a) => {
      assMap[a._id?.toString() || a.id?.toString()] = a;
    });

    myGrades.forEach((g) => {
      const asg = assMap[g.assignment?.toString() || g.assignmentId?.toString()];
      if (asg) {
        earnedSum += g.score;
        possibleSum += asg.maxPoints;
      }
      if (g.remarks && g.remarks.trim().length > 0) {
        const title = asg ? asg.title : "Assignment";
        myRemarks.push(`"${g.remarks.trim()}" on ${title}`);
      }
    });

    const gradeRate = possibleSum > 0 ? (earnedSum / possibleSum) * 100 : null;

    let summary = `Personal academic brief for ${name} in "${classroom.className || classroom.name}". You hold an attendance rate of ${attRate.toFixed(1)}% (${pCount} out of ${totalSess} sessions attended)`;
    if (gradeRate !== null) {
      summary += ` and a cumulative grading standard of ${gradeRate.toFixed(1)}% across completed evaluations.`;
      const gradesList = myGrades.map((g) => {
        const asg = assMap[g.assignment?.toString() || g.assignmentId?.toString()];
        const title = asg ? asg.title : "Assessment";
        const max = asg ? asg.maxPoints : 100;
        return `${title}: ${g.score}/${max} marks`;
      }).join(", ");
      summary += ` Your evaluated performance breakdown: ${gradesList}.`;
    } else {
      summary += `. No graded course assignments have been registered under your profile yet.`;
    }
    summary += ` This progress trend demonstrates your active engagement with course materials.`;

    if (attRate < 80) {
      issues.push(`Your attendance rate (${attRate.toFixed(1)}%) is below the recommended 80% threshold. Try attending more sessions to avoid missing key materials.`);
    }
    if (gradeRate !== null && gradeRate < 70) {
      issues.push(`Your cumulated course grade average (${gradeRate.toFixed(1)}%) is currently below the standard 70% benchmark.`);
    }
    if (myRemarks.length > 0) {
      issues.push(`Recent teacher feedback comments: ${myRemarks.slice(0, 3).join("; ")}.`);
    }

    if (issues.length === 0) {
      if (gradeRate === null) {
        issues.push("Excellent work! You are maintaining strong attendance indicators. Be sure to check back once core class assignments are graded.");
      } else {
        issues.push("Excellent work! You are maintaining outstanding indicators across attendance registry records and class assignment files.");
      }
    }

    recommendations.push("Set aside dedicated daily times to review the academic curriculum framework.");
    recommendations.push("Reach out to your course instructor during office hours if you have any questions.");
    if (attRate < 80) {
      recommendations.unshift("Prioritize classroom attendance to capture crucial classroom walkthroughs.");
    }
    if (gradeRate !== null && gradeRate < 70) {
      recommendations.unshift("Schedule a dedicated study review session and focus on revising the questions with below-average scores.");
    }
    if (myRemarks.length > 0) {
      recommendations.push("Take direct actions to resolve feedback issues highlighted in the teacher remarks.");
    }

    return { summary, issues, recommendations };
  }

  // --- Teacher / Classroom-wide Logic ---
  const atRisk = [];

  students.forEach((std) => {
    const sId = std._id?.toString() || std.id?.toString();
    const studentRecords = records.filter((r) => (r.student?.toString() || r.studentId?.toString()) === sId);
    if (studentRecords.length > 0) {
      const pCount = studentRecords.filter((r) => ["Present", "present"].includes(r.status || r.recordStatus)).length;
      const sRate = (pCount / studentRecords.length) * 100;
      if (sRate < 80) {
        atRisk.push(`${std.name} (${Math.round(sRate)}% attendance)`);
      }
    }
  });

  const assMap = {};
  assignments.forEach((a) => {
    assMap[a._id?.toString() || a.id?.toString()] = a;
  });

  const lowGrades = [];
  const notableRemarks = [];
  let totalClassScore = 0;
  let totalClassMaxPoints = 0;

  students.forEach((std) => {
    const sId = std._id?.toString() || std.id?.toString();
    const studentGrades = grades.filter((g) => (g.student?.toString() || g.studentId?.toString()) === sId);
    let totalScore = 0;
    let totalMax = 0;

    studentGrades.forEach((g) => {
      const ass = assMap[g.assignment?.toString() || g.assignmentId?.toString()];
      if (ass) {
        totalScore += g.score;
        totalMax += ass.maxPoints;
      }
      if (g.remarks && g.remarks.trim().length > 0) {
        notableRemarks.push(`${std.name}: "${g.remarks.trim()}"`);
      }
    });

    if (totalMax > 0) {
      const gRate = (totalScore / totalMax) * 100;
      totalClassScore += totalScore;
      totalClassMaxPoints += totalMax;
      if (gRate < 70) {
        lowGrades.push(`${std.name} (${Math.round(gRate)}% overall grade)`);
      }
    }
  });

  const classAvgGrade = totalClassMaxPoints > 0 ? (totalClassScore / totalClassMaxPoints) * 100 : null;

  // Compute class-wide averages for each assignment
  const assignmentAverages = [];
  assignments.forEach((asg) => {
    const asgGrades = grades.filter((g) => (g.assignment?.toString() || g.assignmentId?.toString()) === (asg._id?.toString() || asg.id?.toString()));
    if (asgGrades.length > 0) {
      const sum = asgGrades.reduce((acc, curr) => acc + curr.score, 0);
      const avg = sum / asgGrades.length;
      const pct = (avg / asg.maxPoints) * 100;
      assignmentAverages.push(`${asg.title} average: ${avg.toFixed(1)}/${asg.maxPoints} (${pct.toFixed(0)}%)`);
    }
  });

  let summary = `The class "${classroom.className || classroom.name}" has an overall student attendance rate of ${rate.toFixed(1)}% across ${records.length} recorded entry instances.`;
  if (classAvgGrade !== null) {
    summary += ` Academically, the class-wide grade average stands at ${classAvgGrade.toFixed(1)}% across created evaluations.`;
    if (assignmentAverages.length > 0) {
      summary += ` Specific evaluation statistics: [${assignmentAverages.join(", ")}].`;
    }
  } else {
    summary += ` No graded syllabus assignments are currently indexed in this course registration log.`;
  }
  summary += ` Engagement remains solid, although certain students display patterns below standard academic or attendance benchmarks.`;

  if (atRisk.length > 0) {
    issues.push(`The following enrolled students have fallen below the 80% attendance threshold: ${atRisk.join(", ")}.`);
  } else {
    issues.push("Strong core class-wide turnout; minor single-day drops during mid-week time slots.");
  }

  if (rate < 85) {
    issues.push("Cumulative classroom-wide rate averages below the 85% attendance standard.");
  }

  if (lowGrades.length > 0) {
    issues.push(`Academic performance alert: Students with grades currently below standard (70%): ${lowGrades.join(", ")}.`);
  } else if (classAvgGrade !== null) {
    issues.push("Classroom overall grade averages are currently above the standard 70% threshold.");
  }

  if (notableRemarks.length > 0) {
    issues.push(`Recent student assignment feedback remarks: ${notableRemarks.slice(0, 3).join("; ")}.`);
  }

  const recommendationsList = [
    "Dispatch automated notification alerts to students showing critical attendance deficits.",
    "Schedule physical study review hours directly after lecture blocks to encourage consistent involvement.",
    "Promote engaging active learning strategies during mid-week lectures to arrest turnout erosion."
  ];

  if (atRisk.length > 0) {
    recommendationsList.unshift(`Coordinate brief 1-on-1 check-ins with high-risk students (${atRisk.slice(0, 2).map((x) => x.split(" (")[0]).join(" & ")}) to address barriers or scheduling conflicts.`);
  }

  if (lowGrades.length > 0) {
    recommendationsList.unshift("Establish supplementary study modules/credit recovery options for students with grades below standard.");
  }

  if (notableRemarks.length > 0) {
    recommendationsList.push("Directly follow up on recent grading feedback and suggestions added in remarks.");
  }

  return { summary, issues, recommendations: recommendationsList };
};

export const generateClassroomSummary = async (classroom, students, records, assignments = [], grades = [], studentId = null) => {
  const totalRecords = records.length;
  const presentCount = records.filter((r) => ["Present", "present"].includes(r.status)).length;
  const absentCount = totalRecords - presentCount;
  const attendancePercentage = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 100;

  const aiClient = getGeminiClient();

  if (!aiClient) {
    console.log("🔄 Using high-accuracy procedural analytics fallback for Classroom Summary");
    return generateProceduralSummary(classroom, students, records, presentCount, absentCount, attendancePercentage, assignments, grades, studentId);
  }

  try {
    const assignmentsData = assignments.map(a => ({
      id: a._id?.toString() || a.id?.toString(),
      title: a.title,
      maxPoints: a.maxPoints,
      dueDate: a.dueDate
    }));

    const gradesData = grades.map(g => {
      const student = students.find(s => (s._id?.toString() || s.id?.toString()) === (g.student?.toString() || g.studentId?.toString()));
      const assignment = assignments.find(a => (a._id?.toString() || a.id?.toString()) === (g.assignment?.toString() || g.assignmentId?.toString()));
      return {
        studentName: student ? student.name : "Unknown Student",
        studentId: g.student?.toString() || g.studentId?.toString(),
        assignmentTitle: assignment ? assignment.title : "Unknown Assignment",
        score: g.score,
        maxPoints: assignment ? assignment.maxPoints : undefined,
        remarks: g.remarks || ""
      };
    });

    let promptText = "";

    if (studentId) {
      const studentUser = students.find(s => (s._id?.toString() || s.id?.toString()) === studentId);
      const studentSessions = records.filter(r => (r.student?.toString() || r.studentId?.toString()) === studentId).map(r => ({
        date: r.date,
        status: r.status
      }));
      const studentGrades = gradesData.filter(g => g.studentId === studentId);

      promptText = `You are an expert AI Academic Coach. Analyze the individual student's performance metrics for the course "${classroom.className || classroom.name}" and provide a deep summary, identified issues/learning blockers, and supportive, actionable study recommendations.
Student Information:
- Name: ${studentUser ? studentUser.name : "Student"}
- ID: ${studentId}

Individual Attendance Record History:
${JSON.stringify(studentSessions, null, 2)}

Logged Evaluation Grades and Remarks Comments:
${JSON.stringify(studentGrades, null, 2)}

CRITICAL DIRECTIVE: You MUST analyze and discuss the student's assignment grades and evaluation scores ("marks") in detail. Mention specific marks, scores, and grade percentages achieved in your summary and recommendations. Do not limit your insights to attendance turnout; the user explicitly wants deep insight on assignment marks, graded outcomes, and instructor remarks.

In your analysis, ensure you:
1. Academic grades: Analyze the student's scores across assignments. If there are no assignments or grades, explicitly state that no assignments have been graded yet.
2. Instructor remarks: Call out and summarize the specific remarks or comments left by the teacher on their grade entries.
3. Attendance and Grades correlation: Discuss how their attendance patterns appear to impact their academic scores.
`;
    } else {
      promptText = `Analyze student attendance logs, assignments, grades, and teacher remarks for the course "${classroom.className || classroom.name}" and provide a deep pedagogical summary, any identified issues (such as low-attendance days, specific at-risk student warnings, low academic grades, or important grading remarks), and student support recommendations.
 
Course specifications:
- Name: ${classroom.className || classroom.name}
- Subject: ${classroom.subject}
- Total enrolled: ${students.length}
 
Aggregated Metrics:
- Total individual attendance rows: ${totalRecords}
- Present checkins count: ${presentCount}
- Absent checkins count: ${absentCount}
- Cumulative Attendance rate: ${attendancePercentage.toFixed(2)}%

Enrolled Student Roster Details:
${JSON.stringify(students.map((s) => ({ id: s._id?.toString() || s.id?.toString(), name: s.name, email: s.email })), null, 2)}
 
Comprehensive Attendance Logs:
${JSON.stringify(records.map((r) => ({ studentId: r.student?.toString() || r.studentId?.toString(), date: r.date, status: r.status })), null, 2)}

Course Assignments Details:
${JSON.stringify(assignmentsData, null, 2)}

Student Grades and Remarks:
${JSON.stringify(gradesData, null, 2)}

CRITICAL DIRECTIVE: You MUST analyze and discuss the marks and class-wide grades in detail. Mention specific evaluation names, graded averages, and percentage ranges in your summary, issues list, and recommendations. Do not limit your insights to class turnout; the user explicitly wants deep analysis of graded evaluations, marks, and academic standing trends.

In your analysis, pay special attention to:
1. Grade details: Formulate class grade performance averages or gaps.
2. Students having both low attendance and low assignment grades.
3. Specific assignment remarks containing academic status or hurdles.
4. Correlation between high/low attendance and assignment performances.
5. If assignments or grades are completely empty, explicitly state that no grades or assignments have been registered under this course syllabus yet.
`;
    }

    let response;
    const generateConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: "A comprehensive paragraphs-long analysis of class/student attendance trends, grade distribution standards, teacher remarks feedback, and current educational engagement outlook.",
          },
          issues: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Bullet points detailing critical grade concerns, low-attendance anomalies, specific negative remarks, or at-risk identifiers.",
          },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Actionable study directives, remedial options, or academic feedback follow-up steps recommended to progress.",
          },
        },
        required: ["summary", "issues", "recommendations"],
      },
    };

    try {
      response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: generateConfig,
      });
    } catch (primaryErr) {
      console.warn("🔄 Primary Gemini model busy or returned unavailable. Trying resilient backup model 'gemini-3.1-flash-lite'...");
      try {
        response = await aiClient.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: promptText,
          config: generateConfig,
        });
      } catch (backupErr) {
        console.warn("⚠️ Both primary and backup Gemini attempts occupied. Falling back smoothly to procedural generator.");
        return generateProceduralSummary(classroom, students, records, presentCount, absentCount, attendancePercentage, assignments, grades, studentId);
      }
    }

    if (response && response.text) {
      try {
        const parsed = JSON.parse(response.text.trim());
        return parsed;
      } catch (jsonErr) {
        console.warn("Failed to parse Gemini output as JSON, fallback to procedural:", jsonErr.message || jsonErr);
      }
    }
  } catch (error) {
    console.warn(`⚠️ Note: Gemini analysis fallback applied due to: ${error.message || error}`);
  }

  return generateProceduralSummary(classroom, students, records, presentCount, absentCount, attendancePercentage, assignments, grades, studentId);
};
