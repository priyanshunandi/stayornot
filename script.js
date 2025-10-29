import { Chart } from "@/components/ui/chart"
function $(id) {
  return document.getElementById(id)
}

let databuddy // Declare the databuddy variable

document.addEventListener("DOMContentLoaded", () => {
  // Sync sliders with outputs
  ;["growthOps", "learningOps", "workLife", "mentalHealth", "satisfaction", "commute"].forEach((id) => {
    const el = $(id),
      out = $(id + "Val")
    if (el && out) {
      el.addEventListener("input", () => (out.textContent = el.value))
      out.textContent = el.value
    }
  })

  // Pagination
  let currentPage = 1
  const totalPages = 5

  function showPage(n) {
    const direction = n > currentPage ? "right" : "left"
    for (let i = 1; i <= totalPages; i++) {
      const p = $("cPage" + i)
      if (!p) continue
      if (i === n) {
        p.style.display = ""
        p.classList.remove("leave-left", "leave-right")
        p.classList.add("enter")
      } else {
        p.classList.remove("enter")
        p.classList.add(direction === "right" ? "leave-left" : "leave-right")
        setTimeout(() => {
          if (i !== n) p.style.display = "none"
        }, 360)
      }
    }
    currentPage = n
    $("prevPage").disabled = n === 1

    // toggle Analyze state
    if (n === totalPages) {
      $("nextPage").style.display = "none"
      $("analyze").disabled = false
      $("analyze").classList.remove("disabled")
      $("analyze").classList.add("pulse")
    } else {
      $("nextPage").style.display = ""
      $("analyze").disabled = true
      $("analyze").classList.add("disabled")
      $("analyze").classList.remove("pulse")
    }
  }

  // Reset
  $("reset").addEventListener("click", () => {
    $("quiz").reset()
    $("result").classList.add("hidden")
    // reset outputs
    ;["growthOps", "learningOps", "workLife", "mentalHealth", "satisfaction", "commute"].forEach((id) => {
      const el = $(id),
        out = $(id + "Val")
      if (el && out) out.textContent = el.value
    })
    // reset to first page
    showPage(1)
  })

  // Navigation
  $("prevPage").addEventListener("click", () => {
    if (currentPage > 1) showPage(currentPage - 1)
  })
  $("nextPage").addEventListener("click", () => {
    if (currentPage < totalPages) showPage(currentPage + 1)
  })

  // Analyze button — always bound
  $("analyze").addEventListener("click", () => {
    if (!$("analyze").disabled) {
      // Add loading state
      const btn = $("analyze")
      const originalText = btn.innerHTML
      btn.innerHTML = 'Analyzing<span class="spinner"></span>'
      btn.disabled = true

      // Slight delay for better UX
      setTimeout(() => {
        analyze()
        btn.innerHTML = originalText
        btn.disabled = false
      }, 600)
    }
  })

  // Start on page 1
  showPage(1)
})

// =======================
// Analyze function
// =======================
function analyze() {
  // Track analytics event if available
  if (typeof databuddy !== "undefined") {
    try {
      databuddy.track("analysis_completed")
    } catch (e) {
      console.log("Analytics tracking skipped")
    }
  }

  function getFromPages(selector) {
    for (let i = 1; i <= 5; i++) {
      const page = $("cPage" + i)
      if (page) {
        const el = page.querySelector(selector)
        if (el) return el
      }
    }
    return document.querySelector(selector)
  }

  // Collect inputs
  const jobTitle = (getFromPages("#jobTitle")?.value || "").trim()
  const yearsExp = Number(getFromPages("#yearsExp")?.value || 0)
  const curSal = Number(getFromPages("#currentSalary")?.value || 0)
  const indSal = Number(getFromPages("#industrySalary")?.value || 0)
  const incomeDep = Number(getFromPages("#incomeDependency")?.value || 1)
  const increment = Number(getFromPages("#increment")?.value || 0)
  const runway = Number(getFromPages("#runway")?.value || 0)
  const skillMatch = Number(getFromPages("#skillMatch")?.value || 0.5)
  const betterSkills = Number(getFromPages("#betterSkills")?.value || 0)
  const growthOps = Number(getFromPages("#growthOps")?.value || 0)
  const learningOps = Number(getFromPages("#learningOps")?.value || 0)
  const workLife = Number(getFromPages("#workLife")?.value || 50)
  const mental = Number(getFromPages("#mentalHealth")?.value || 0)
  const satisfaction = Number(getFromPages("#satisfaction")?.value || 50)
  const commute = Number(getFromPages("#commute")?.value || 50)
  const culture = (getFromPages("#culture")?.value || "").trim()
  const notes = (getFromPages("#notes")?.value || "").trim()

  // Score components
  const salaryRel = indSal > 0 ? Math.min(1, curSal / indSal) : 0.8
  const growthScore = growthOps / 100
  const learningScore = learningOps / 100
  const workLifeScore = workLife / 100
  const mentalScore = 1 - Math.min(1, mental / 100)
  const satisfactionScore = satisfaction / 100
  const skillComposite = skillMatch * 0.7 + betterSkills * 0.3

  const weights = {
    salary: 0.18,
    incomeDependence: 0.12,
    growth: 0.15,
    learning: 0.12,
    skills: 0.12,
    workLife: 0.12,
    mental: 0.12,
    satisfaction: 0.07,
  }
  const score =
    salaryRel * weights.salary +
    (1 - incomeDep) * weights.incomeDependence +
    growthScore * weights.growth +
    learningScore * weights.learning +
    skillComposite * weights.skills +
    workLifeScore * weights.workLife +
    mentalScore * weights.mental +
    satisfactionScore * weights.satisfaction
  const finalScorePct = Math.round((score / Object.values(weights).reduce((a, b) => a + b, 0)) * 100)
  const finalScore = Math.round(finalScorePct / 10)

  // Recommendation
  let shortMsg = "",
    actions = []
  if (finalScorePct >= 75) {
    shortMsg = "Strong alignment — staying is reasonable; keep building leverage."
    actions = ["Keep documenting wins.", "Prepare a case for fair pay.", "Plan a 6–12 month growth roadmap."]
  } else if (finalScorePct >= 55) {
    shortMsg = "Mixed alignment — explore selectively while improving key gaps."
    actions = ["Discuss growth with manager.", "Upgrade 2–3 skills.", "Start passive job search."]
  } else if (finalScorePct >= 40) {
    shortMsg = "Explore better options; update resume and talk to peers."
    actions = ["Update CV.", "Plan exit if wellbeing is poor.", "Seek referrals."]
  } else {
    shortMsg = "Low alignment — consider moving on."
    actions = ["Plan job search soon.", "Seek support.", "Target healthier roles."]
  }

  if (mental >= 60) actions.unshift("Address mental health first.")
  if (runway < 3 && incomeDep === 1) actions.push("Boost savings before risking change.")
  if (curSal < indSal * 0.85) actions.push("You're paid below industry avg — negotiate or move.")

  // Banner
  const summaryNode = $("summary")
  summaryNode.innerHTML = ""
  let toneClass = "score-mid"
  if (finalScore <= 3) toneClass = "score-low"
  else if (finalScore >= 7) toneClass = "score-high"
  const banner = document.createElement("div")
  banner.className = `result-banner ${toneClass}`

  const top = document.createElement("div")
  top.className = "banner-row"
  const icon = document.createElement("div")
  icon.className = "badge-icon"
  icon.textContent = "i"
  const pills = document.createElement("div")
  pills.className = "pills"
  const cat = document.createElement("span")
  cat.className = "pill small"
  cat.innerText = shortMsg
  const scoreP = document.createElement("span")
  scoreP.className = "pill"
  scoreP.innerText = `Score ${finalScore}/10`
  const salDelta = indSal > 0 ? Math.round(((curSal - indSal) / indSal) * 100) : 0
  const salP = document.createElement("span")
  salP.className = "pill small"
  salP.innerText = `Salary Δ ${salDelta}%`
  ;[cat, scoreP, salP].forEach((x) => pills.appendChild(x))
  top.appendChild(icon)
  top.appendChild(pills)
  const msg = document.createElement("div")
  msg.className = "banner-message"
  msg.innerText = shortMsg
  const sub = document.createElement("div")
  sub.className = "banner-sub"
  sub.innerText = `Context: ${jobTitle || "—"} ${culture ? "• " + culture : ""} ${notes ? "• " + notes : ""}`
  ;[top, msg, sub].forEach((x) => banner.appendChild(x))
  summaryNode.appendChild(banner)

  generateDetailedInsights({
    finalScore,
    finalScorePct,
    salaryRel,
    growthScore,
    learningScore,
    workLifeScore,
    mentalScore,
    satisfactionScore,
    curSal,
    indSal,
    mental,
    workLife,
    satisfaction,
    growthOps,
    learningOps,
    runway,
    incomeDep,
  })

  generateProsConsAnalysis({
    finalScore,
    salaryRel,
    growthScore,
    learningScore,
    workLifeScore,
    mentalScore,
    satisfactionScore,
    curSal,
    indSal,
    mental,
    workLife,
    satisfaction,
    commute,
    culture,
    skillMatch,
    betterSkills,
    runway,
    incomeDep,
  })

  generateRiskAssessment({
    runway,
    incomeDep,
    mental,
    salaryRel,
    yearsExp,
    curSal,
    indSal,
    growthScore,
    skillMatch,
    betterSkills,
  })

  generateTimeline({ finalScore, runway, mental, incomeDep, salaryRel })

  // Actions
  const list = $("actionsList")
  list.innerHTML = ""
  actions.forEach((a, idx) => {
    const li = document.createElement("li")
    li.innerText = a
    li.style.opacity = "0"
    li.style.transform = "translateX(-20px)"
    list.appendChild(li)
    setTimeout(
      () => {
        li.style.transition = "all 0.4s ease"
        li.style.opacity = "1"
        li.style.transform = "translateX(0)"
      },
      100 + idx * 80,
    )
  })

  generateResources({ finalScore, mental, salaryRel, growthScore, jobTitle })

  // Bars
  const comps = {
    "Salary vs Industry": Math.round(salaryRel * 100),
    "Income dependence": Math.round((1 - incomeDep) * 100),
    "Growth opportunities": Math.round(growthScore * 100),
    "Learning opportunities": Math.round(learningScore * 100),
    "Skill fit": Math.round(skillComposite * 100),
    "Work-life balance": Math.round(workLifeScore * 100),
    "Mental health": Math.round(mentalScore * 100),
    "Job satisfaction": Math.round(satisfactionScore * 100),
  }
  const bars = $("bars")
  bars.innerHTML = ""
  Object.entries(comps).forEach(([k, val], idx) => {
    const row = document.createElement("div")
    row.className = "bar-row"
    const label = document.createElement("div")
    label.className = "bar-label"
    label.innerText = k
    const track = document.createElement("div")
    track.className = "bar-track"
    const fill = document.createElement("div")
    fill.className = "bar-fill"
    fill.style.width = "0%"
    const pct = document.createElement("div")
    pct.className = "bar-percent"
    pct.innerText = val + "%"
    if (val <= 40) pct.classList.add("low")
    else if (val <= 70) pct.classList.add("mid")
    else pct.classList.add("high")
    track.appendChild(fill)
    ;[label, track, pct].forEach((x) => row.appendChild(x))
    bars.appendChild(row)
    setTimeout(
      () => {
        fill.style.width = val + "%"
      },
      200 + idx * 100,
    )
  })

  // Score visuals with animation
  if ($("scoreNum")) $("scoreNum").innerText = `${finalScore}/10`
  if ($("gaugeArc")) {
    let currentScore = 0
    const gaugeInterval = setInterval(() => {
      if (currentScore >= finalScorePct) {
        clearInterval(gaugeInterval)
        $("gaugeArc").setAttribute("stroke-dasharray", `${finalScorePct},100`)
        if ($("gaugeText")) $("gaugeText").innerText = finalScore
      } else {
        currentScore += 2
        $("gaugeArc").setAttribute("stroke-dasharray", `${currentScore},100`)
        if ($("gaugeText")) $("gaugeText").innerText = Math.round(currentScore / 10)
      }
    }, 20)
  }

  // Chart
  try {
    const ctx = $("miniChart")?.getContext("2d")
    if (ctx) {
      if (window._miniChart) window._miniChart.destroy()
      window._miniChart = new Chart(ctx, {
        type: "radar",
        data: {
          labels: Object.keys(comps),
          datasets: [
            {
              data: Object.values(comps),
              backgroundColor: "rgba(250,204,21,0.2)",
              borderColor: "#facc15",
              borderWidth: 2,
              pointBackgroundColor: "#f5f50a",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            r: { beginAtZero: true, max: 100, ticks: { display: false }, grid: { color: "rgba(0,0,0,0.05)" } },
          },
          animation: { duration: 1200, easing: "easeOutQuart" },
        },
      })
    }
  } catch (e) {
    console.warn(e)
  }

  // Show result with fade-in
  const resultEl = $("result")
  resultEl.classList.remove("hidden")
  resultEl.style.opacity = 0
  setTimeout(() => {
    resultEl.style.transition = "opacity 0.8s ease-out"
    resultEl.style.opacity = 1
  }, 50)

  setTimeout(() => {
    const scoreTop = document.querySelector(".score-top")
    if (scoreTop) scoreTop.classList.add("score-pop")
  }, 300)

  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
}

function generateDetailedInsights(data) {
  const container = $("detailedInsights")
  container.innerHTML = ""

  const card = document.createElement("div")
  card.className = "insight-card"

  const title = document.createElement("h3")
  title.innerHTML = "🔍 What Your Scores Mean"
  card.appendChild(title)

  const grid = document.createElement("div")
  grid.className = "insight-grid"

  const insights = []

  // Salary insight
  if (data.salaryRel < 0.85) {
    insights.push({
      title: "Compensation Gap",
      status: "critical",
      text: `You're earning ${Math.round((1 - data.salaryRel) * 100)}% below industry average. This significantly impacts your long-term wealth building.`,
    })
  } else if (data.salaryRel >= 1.1) {
    insights.push({
      title: "Strong Compensation",
      status: "good",
      text: `You're earning ${Math.round((data.salaryRel - 1) * 100)}% above industry average. This is a strong financial anchor.`,
    })
  }

  // Mental health insight
  if (data.mental >= 60) {
    insights.push({
      title: "Mental Health Alert",
      status: "critical",
      text: "Your mental health is significantly impacted. This should be your top priority before any career decision.",
    })
  } else if (data.mental >= 40) {
    insights.push({
      title: "Mental Health Concern",
      status: "warning",
      text: "Moderate mental health impact detected. Consider stress management strategies and support systems.",
    })
  }

  // Growth insight
  if (data.growthScore < 0.4) {
    insights.push({
      title: "Limited Growth Path",
      status: "warning",
      text: "Low growth opportunities may stagnate your career. Consider if this aligns with your 3-5 year goals.",
    })
  } else if (data.growthScore >= 0.7) {
    insights.push({
      title: "Strong Growth Potential",
      status: "good",
      text: "Excellent growth opportunities available. Leverage these to accelerate your career trajectory.",
    })
  }

  // Work-life balance insight
  if (data.workLifeScore < 0.4) {
    insights.push({
      title: "Work-Life Imbalance",
      status: "warning",
      text: "Poor work-life balance can lead to burnout. This is unsustainable long-term.",
    })
  }

  // Financial runway insight
  if (data.runway < 3 && data.incomeDep >= 0.5) {
    insights.push({
      title: "Financial Vulnerability",
      status: "critical",
      text: "Low savings runway with high income dependency creates risk. Build 6+ months emergency fund before major changes.",
    })
  } else if (data.runway >= 6) {
    insights.push({
      title: "Financial Security",
      status: "good",
      text: "Strong financial runway gives you flexibility to make career moves strategically.",
    })
  }

  // Learning insight
  if (data.learningScore >= 0.7) {
    insights.push({
      title: "Learning Environment",
      status: "good",
      text: "Strong learning opportunities help you stay competitive and marketable.",
    })
  }

  insights.forEach((insight) => {
    const item = document.createElement("div")
    item.className = "insight-item"
    item.innerHTML = `
      <h4>${insight.title}<span class="insight-status ${insight.status}">${insight.status.toUpperCase()}</span></h4>
      <p>${insight.text}</p>
    `
    grid.appendChild(item)
  })

  card.appendChild(grid)
  container.appendChild(card)
}

function generateProsConsAnalysis(data) {
  const container = $("prosConsSection")
  container.innerHTML = ""

  const card = document.createElement("div")
  card.className = "insight-card"

  const title = document.createElement("h3")
  title.innerHTML = "⚖️ Staying vs. Moving"
  card.appendChild(title)

  const grid = document.createElement("div")
  grid.className = "pros-cons-grid"

  // Pros of staying
  const prosBox = document.createElement("div")
  prosBox.className = "pros-box"
  prosBox.innerHTML = "<h4>✓ Reasons to Stay</h4><ul></ul>"
  const prosList = prosBox.querySelector("ul")

  const pros = []
  if (data.salaryRel >= 0.95) pros.push("Competitive compensation")
  if (data.workLifeScore >= 0.6) pros.push("Good work-life balance")
  if (data.growthScore >= 0.6) pros.push("Growth opportunities available")
  if (data.learningScore >= 0.6) pros.push("Strong learning environment")
  if (data.satisfactionScore >= 0.6) pros.push("Generally satisfied with role")
  if (data.commute >= 60) pros.push("Convenient commute/remote setup")
  if (data.culture && !data.culture.toLowerCase().includes("toxic")) pros.push("Positive company culture")
  if (data.runway < 6 && data.incomeDep >= 0.5) pros.push("Financial stability while building runway")
  if (data.skillMatch >= 0.5) pros.push("Skills align with current role")

  if (pros.length === 0) pros.push("Provides income stability while you plan next steps")

  pros.forEach((pro) => {
    const li = document.createElement("li")
    li.textContent = pro
    prosList.appendChild(li)
  })

  // Cons of staying
  const consBox = document.createElement("div")
  consBox.className = "cons-box"
  consBox.innerHTML = "<h4>✗ Reasons to Move</h4><ul></ul>"
  const consList = consBox.querySelector("ul")

  const cons = []
  if (data.salaryRel < 0.85) cons.push(`Underpaid by ${Math.round((1 - data.salaryRel) * 100)}% vs market`)
  if (data.mental >= 50) cons.push("Negative mental health impact")
  if (data.growthScore < 0.4) cons.push("Limited career growth")
  if (data.learningScore < 0.4) cons.push("Stagnant learning opportunities")
  if (data.workLifeScore < 0.4) cons.push("Poor work-life balance")
  if (data.satisfactionScore < 0.4) cons.push("Low job satisfaction")
  if (data.betterSkills >= 0.5) cons.push("Your skills could be better utilized elsewhere")
  if (data.culture && data.culture.toLowerCase().includes("toxic")) cons.push("Toxic company culture")
  if (data.skillMatch < 0.5) cons.push("Skills mismatch with role")

  if (cons.length === 0) cons.push("Opportunity cost of not exploring better options")

  cons.forEach((con) => {
    const li = document.createElement("li")
    li.textContent = con
    consList.appendChild(li)
  })

  grid.appendChild(prosBox)
  grid.appendChild(consBox)
  card.appendChild(grid)
  container.appendChild(card)
}

function generateRiskAssessment(data) {
  const container = $("riskAssessment")
  container.innerHTML = ""

  const card = document.createElement("div")
  card.className = "insight-card"

  const title = document.createElement("h3")
  title.innerHTML = "⚠️ Risk Assessment"
  card.appendChild(title)

  const grid = document.createElement("div")
  grid.className = "risk-grid"

  const risks = []

  // Financial risk
  let financialRisk = "low"
  let financialText = "Strong financial position with adequate runway."
  if (data.runway < 3 && data.incomeDep >= 0.5) {
    financialRisk = "high"
    financialText = "High financial risk: Low savings with high income dependency. Build emergency fund first."
  } else if (data.runway < 6 || data.incomeDep >= 0.5) {
    financialRisk = "medium"
    financialText = "Moderate financial risk: Consider building more runway before major changes."
  }

  risks.push({
    level: financialRisk,
    icon: "💰",
    title: "Financial Risk",
    text: financialText,
  })

  // Health risk
  let healthRisk = "low"
  let healthText = "Mental health appears stable."
  if (data.mental >= 60) {
    healthRisk = "high"
    healthText = "Critical: High mental health impact. Seek professional support immediately."
  } else if (data.mental >= 40) {
    healthRisk = "medium"
    healthText = "Moderate mental health concerns. Monitor closely and consider interventions."
  }

  risks.push({
    level: healthRisk,
    icon: "🧠",
    title: "Mental Health Risk",
    text: healthText,
  })

  // Career stagnation risk
  let careerRisk = "low"
  let careerText = "Good career development trajectory."
  if (data.growthScore < 0.3 && data.yearsExp < 10) {
    careerRisk = "high"
    careerText = "High risk of career stagnation in critical growth years. Consider moving soon."
  } else if (data.growthScore < 0.5) {
    careerRisk = "medium"
    careerText = "Moderate stagnation risk. Seek growth opportunities or consider alternatives."
  }

  risks.push({
    level: careerRisk,
    icon: "📈",
    title: "Career Stagnation Risk",
    text: careerText,
  })

  // Market competitiveness risk
  let marketRisk = "low"
  let marketText = "Skills remain competitive in job market."
  if (data.skillMatch < 0.5 && data.betterSkills < 0.5) {
    marketRisk = "high"
    marketText = "High risk: Skills may be falling behind market demands. Upskill urgently."
  } else if (data.betterSkills >= 0.5) {
    marketRisk = "medium"
    marketText = "Your skills could command better opportunities elsewhere."
  }

  risks.push({
    level: marketRisk,
    icon: "🎯",
    title: "Market Position Risk",
    text: marketText,
  })

  risks.forEach((risk) => {
    const item = document.createElement("div")
    item.className = "risk-item"
    item.innerHTML = `
      <div class="risk-icon ${risk.level}">${risk.icon}</div>
      <div class="risk-content">
        <h4>${risk.title}</h4>
        <p>${risk.text}</p>
      </div>
    `
    grid.appendChild(item)
  })

  card.appendChild(grid)
  container.appendChild(card)
}

function generateTimeline(data) {
  const container = $("timelineSection")
  container.innerHTML = ""

  const card = document.createElement("div")
  card.className = "insight-card"

  const title = document.createElement("h3")
  title.innerHTML = "📅 Recommended Timeline"
  card.appendChild(title)

  const timeline = document.createElement("div")
  timeline.className = "timeline"

  const phases = []

  if (data.mental >= 60) {
    phases.push({
      period: "Immediate",
      title: "Address Mental Health",
      text: "Seek professional support, take time off if needed, and stabilize your wellbeing before making career decisions.",
    })
  }

  if (data.runway < 6 && data.incomeDep >= 0.5) {
    phases.push({
      period: "0-3 months",
      title: "Build Financial Buffer",
      text: "Focus on saving 3-6 months of expenses. Cut unnecessary costs and maximize savings rate.",
    })
  }

  if (data.finalScore <= 5) {
    phases.push({
      period: "1-2 months",
      title: "Prepare Exit Strategy",
      text: "Update resume, activate network, start applying to roles. Set target exit date within 3-6 months.",
    })
    phases.push({
      period: "2-4 months",
      title: "Active Job Search",
      text: "Interview actively, negotiate offers, and secure next opportunity. Aim for 20%+ improvement in key areas.",
    })
  } else if (data.finalScore <= 7) {
    phases.push({
      period: "1-3 months",
      title: "Assess & Negotiate",
      text: "Have honest conversation with manager about growth and compensation. Document your value and prepare negotiation case.",
    })
    phases.push({
      period: "3-6 months",
      title: "Passive Exploration",
      text: "Keep resume updated, take recruiter calls, and explore opportunities without urgency. Set clear criteria for moving.",
    })
  } else {
    phases.push({
      period: "0-6 months",
      title: "Optimize Current Role",
      text: "Document achievements, take on stretch projects, and build case for promotion or raise.",
    })
    phases.push({
      period: "6-12 months",
      title: "Strategic Planning",
      text: "Set clear career goals, identify skill gaps, and create development plan. Reassess market position annually.",
    })
  }

  if (data.salaryRel < 0.9) {
    phases.push({
      period: "Next review",
      title: "Compensation Discussion",
      text: "Prepare market data and achievement portfolio. Request compensation adjustment to market rate.",
    })
  }

  phases.forEach((phase) => {
    const item = document.createElement("div")
    item.className = "timeline-item"
    item.innerHTML = `
      <h4>${phase.title}<span class="timeline-badge">${phase.period}</span></h4>
      <p>${phase.text}</p>
    `
    timeline.appendChild(item)
  })

  card.appendChild(timeline)
  container.appendChild(card)
}

function generateResources(data) {
  const container = $("resourcesSection")
  container.innerHTML = ""

  const card = document.createElement("div")
  card.className = "insight-card"

  const title = document.createElement("h3")
  title.innerHTML = "📚 Recommended Resources"
  card.appendChild(title)

  const grid = document.createElement("div")
  grid.className = "resource-grid"

  const resources = []

  if (data.mental >= 40) {
    resources.push({
      icon: "🧘",
      title: "Mental Health Support",
      text: "Consider therapy, meditation apps (Headspace, Calm), or employee assistance programs.",
    })
  }

  if (data.salaryRel < 0.9) {
    resources.push({
      icon: "💼",
      title: "Salary Negotiation",
      text: 'Research: Levels.fyi, Glassdoor, Blind. Read "Never Split the Difference" by Chris Voss.',
    })
  }

  if (data.growthScore < 0.5) {
    resources.push({
      icon: "📈",
      title: "Career Development",
      text: "Seek mentorship, take on stretch projects, or consider career coaching services.",
    })
  }

  if (data.finalScore <= 5) {
    resources.push({
      icon: "🔍",
      title: "Job Search Platforms",
      text: `LinkedIn, Indeed, ${data.jobTitle ? "specialized " + data.jobTitle + " job boards" : "industry-specific boards"}.`,
    })
  }

  resources.push({
    icon: "🎓",
    title: "Skill Development",
    text: "Coursera, Udemy, LinkedIn Learning for upskilling. Focus on high-demand skills in your field.",
  })

  resources.push({
    icon: "🤝",
    title: "Professional Network",
    text: "Attend industry meetups, join professional associations, engage on LinkedIn regularly.",
  })

  if (data.finalScore >= 7) {
    resources.push({
      icon: "💰",
      title: "Financial Planning",
      text: "Maximize 401k, build investment portfolio, consider financial advisor for wealth building.",
    })
  }

  resources.push({
    icon: "📝",
    title: "Career Documentation",
    text: 'Keep a "brag document" of achievements, metrics, and impact for reviews and interviews.',
  })

  resources.forEach((resource) => {
    const item = document.createElement("div")
    item.className = "resource-card"
    item.innerHTML = `
      <h4>${resource.icon} ${resource.title}</h4>
      <p>${resource.text}</p>
    `
    grid.appendChild(item)
  })

  card.appendChild(grid)
  container.appendChild(card)
}
