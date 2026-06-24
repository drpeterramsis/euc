import React, { useState, useEffect, FormEvent } from "react";
import { useApp } from "../context/AppContext";
import { 
  Trophy, 
  Tv, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Settings, 
  Users, 
  Check, 
  TrendingUp,
  AlertCircle
} from "lucide-react";

export default function WorldCupCard() {
  const { currentUser } = useApp() as any;
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<any>({
    title: "Egypt vs Iran — FIFA World Cup",
    dateTime: "2026-06-26T21:00:00",
    liveStreamUrl: ""
  });
  const [votesSummary, setVotesSummary] = useState({
    egypt: 0,
    iran: 0,
    draw: 0,
    total: 0
  });
  const [userVote, setUserVote] = useState<any>(null);
  const [isVotingExpanded, setIsVotingExpanded] = useState(false);
  const [isAdminDashboardExpanded, setIsAdminDashboardExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "voters" | "admin">("voters");

  // Admin Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formDateTime, setFormDateTime] = useState("");
  const [formLiveStream, setFormLiveStream] = useState("");
  const [adminMessage, setAdminMessage] = useState({ type: "", text: "" });

  // Voting inputs
  const [selectedWinner, setSelectedWinner] = useState<"Egypt" | "Iran" | "Draw" | "">("");
  const [predictScoreEgypt, setPredictScoreEgypt] = useState("");
  const [predictScoreIran, setPredictScoreIran] = useState("");
  const [votingMessage, setVotingMessage] = useState({ type: "", text: "" });
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  // Admin voter breakdown
  const [votersList, setVotersList] = useState<any[]>([]);
  const [loadingVoters, setLoadingVoters] = useState(false);

  // Countdown calculations
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false
  });

  const username = currentUser?.username || "";
  const isAdmin = currentUser?.role === "admin";

  // Fetch match details
  const fetchMatchData = async () => {
    try {
      const res = await fetch(`/api/worldcup/match?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = await res.json();
        setMatch(data.match);
        setVotesSummary(data.votesSummary);
        setUserVote(data.userVote);

        // Pre-populate admin fields
        setFormTitle(data.match.title);
        setFormDateTime(data.match.dateTime);
        setFormLiveStream(data.match.liveStreamUrl || "");

        // Pre-populate voter fields if voted
        if (data.userVote) {
          setSelectedWinner(data.userVote.winner);
          if (data.userVote.score && data.userVote.score.includes("-")) {
            const parts = data.userVote.score.split("-");
            setPredictScoreEgypt(parts[0].trim());
            setPredictScoreIran(parts[1].trim());
          }
        }
      }
    } catch (e) {
      console.error("Failed to load world cup details:", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch voters (for admin)
  const fetchVoters = async () => {
    if (!isAdmin) return;
    setLoadingVoters(true);
    try {
      const res = await fetch(`/api/worldcup/admin/votes?role=admin`);
      if (res.ok) {
        const data = await res.json();
        setVotersList(data.votes || []);
      }
    } catch (e) {
      console.error("Failed to load voters list:", e);
    } finally {
      setLoadingVoters(false);
    }
  };

  useEffect(() => {
    fetchMatchData();
  }, [username]);

  // Dynamic countdown timer
  useEffect(() => {
    if (!match.dateTime) return;

    const interval = setInterval(() => {
      // Parse match date as a local Prague date
      const matchTime = new Date(match.dateTime).getTime();
      const now = new Date().getTime();
      const diff = matchTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isOver: false });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [match.dateTime]);

  // Submit Vote
  const handleVoteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username) {
      setVotingMessage({ type: "error", text: "Please log in to cast your prediction!" });
      return;
    }
    if (!selectedWinner) {
      setVotingMessage({ type: "error", text: "Please choose who you think will win!" });
      return;
    }

    setIsSubmittingVote(true);
    setVotingMessage({ type: "", text: "" });

    const scoreStr = predictScoreEgypt !== "" && predictScoreIran !== "" 
      ? `${predictScoreEgypt.trim()}-${predictScoreIran.trim()}`
      : "";

    try {
      const res = await fetch("/api/worldcup/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          winner: selectedWinner,
          score: scoreStr
        })
      });

      if (res.ok) {
        setVotingMessage({ type: "success", text: "Prediction successfully saved! 🎉" });
        fetchMatchData();
      } else {
        const err = await res.json();
        setVotingMessage({ type: "error", text: err.error || "Failed to submit prediction." });
      }
    } catch (err) {
      setVotingMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // Submit Admin settings
  const handleAdminSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAdminMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/worldcup/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "admin",
          title: formTitle,
          dateTime: formDateTime,
          liveStreamUrl: formLiveStream
        })
      });

      if (res.ok) {
        setAdminMessage({ type: "success", text: "Match settings updated successfully!" });
        fetchMatchData();
      } else {
        const err = await res.json();
        setAdminMessage({ type: "error", text: err.error || "Failed to update match settings." });
      }
    } catch (e) {
      setAdminMessage({ type: "error", text: "Network error occurred." });
    }
  };

  // Format Prague kickoff string
  const formatKickoff = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "June 26, 2026 at 21:00 Prague Time";
      return date.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }) + " at " + date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }) + " Prague Time";
    } catch {
      return dateStr;
    }
  };

  // Calculate percentages
  const egyptPct = votesSummary.total > 0 ? Math.round((votesSummary.egypt / votesSummary.total) * 100) : 0;
  const iranPct = votesSummary.total > 0 ? Math.round((votesSummary.iran / votesSummary.total) * 100) : 0;
  const drawPct = votesSummary.total > 0 ? Math.round((votesSummary.draw / votesSummary.total) * 100) : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[220px]">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3"></div>
        <p className="text-xs font-bold text-gray-500">Retrieving Match Details...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative group transition-all duration-300 hover:shadow-2xl hover:border-indigo-500/30">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flagWave {
          0% { transform: translateY(0) scale(1) rotate(0deg); }
          25% { transform: translateY(-3px) scale(1.03) rotate(1.5deg) skewY(1deg); }
          50% { transform: translateY(0) scale(1) rotate(0deg); }
          75% { transform: translateY(3px) scale(0.97) rotate(-1.5deg) skewY(-1deg); }
          100% { transform: translateY(0) scale(1) rotate(0deg); }
        }
        .wavy-flag {
          display: inline-block;
          filter: drop-shadow(0 6px 15px rgba(0,0,0,0.4));
        }
        .wavy-flag-egypt {
          animation: flagWave 3.2s ease-in-out infinite;
        }
        .wavy-flag-iran {
          animation: flagWave 3.5s ease-in-out infinite;
          animation-delay: -1.6s;
        }
      `}} />

      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ── CENTRAL MATCH DISPLAY (ALWAYS VISIBLE) ───────────────────────── */}
      <div className="flex items-center justify-center gap-6 sm:gap-12 py-8 px-5 bg-slate-950/40 border-b border-slate-900">
        {/* Egypt */}
        <div className="flex flex-col items-center flex-1 text-center">
          <div className="text-6xl sm:text-7xl select-none wavy-flag wavy-flag-egypt mb-3 leading-none font-sans">
            🇪🇬
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Egypt
          </span>
        </div>

        {/* VS Badge */}
        <div className="flex flex-col items-center shrink-0">
          <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-black text-emerald-400 tracking-widest uppercase shadow-md">
            VS
          </div>
        </div>

        {/* Iran */}
        <div className="flex flex-col items-center flex-1 text-center">
          <div className="text-6xl sm:text-7xl select-none wavy-flag wavy-flag-iran mb-3 leading-none font-sans">
            🇮🇷
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Iran
          </span>
        </div>
      </div>

      {/* ── COUNTDOWN TIMER (ALWAYS VISIBLE BELOW MATCH DETAILS) ─────────── */}
      <div className="p-5 flex flex-col items-center border-b border-slate-900/60 bg-gradient-to-b from-transparent to-slate-950/20">
        <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2.5 flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-emerald-500" />
          <span>Match Kickoff Countdown</span>
        </div>

        {!timeLeft.isOver ? (
          <div className="flex items-center justify-center gap-3">
            {/* Days */}
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white font-black text-lg px-2.5 py-1.5 rounded-lg min-w-[38px] text-center border border-slate-800 shadow-lg">
                {String(timeLeft.days).padStart(2, "0")}
              </div>
              <span className="text-[7px] font-bold tracking-widest text-slate-500 uppercase mt-1">Days</span>
            </div>
            <span className="text-lg font-bold text-emerald-400 select-none -mt-4 animate-pulse">:</span>

            {/* Hours */}
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white font-black text-lg px-2.5 py-1.5 rounded-lg min-w-[38px] text-center border border-slate-800 shadow-lg">
                {String(timeLeft.hours).padStart(2, "0")}
              </div>
              <span className="text-[7px] font-bold tracking-widest text-slate-500 uppercase mt-1">Hours</span>
            </div>
            <span className="text-lg font-bold text-emerald-400 select-none -mt-4 animate-pulse">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white font-black text-lg px-2.5 py-1.5 rounded-lg min-w-[38px] text-center border border-slate-800 shadow-lg">
                {String(timeLeft.minutes).padStart(2, "0")}
              </div>
              <span className="text-[7px] font-bold tracking-widest text-slate-500 uppercase mt-1">Mins</span>
            </div>
            <span className="text-lg font-bold text-emerald-400 select-none -mt-4 animate-pulse">:</span>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white font-black text-lg px-2.5 py-1.5 rounded-lg min-w-[38px] text-center border border-slate-800 shadow-lg text-emerald-400">
                {String(timeLeft.seconds).padStart(2, "0")}
              </div>
              <span className="text-[7px] font-bold tracking-widest text-slate-500 uppercase mt-1">Secs</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full text-red-400 font-extrabold text-[9px] uppercase tracking-wider animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 block animate-ping" />
            <span>Match is Live / Concluded</span>
          </div>
        )}

        <p className="text-[9px] font-semibold text-slate-400 mt-3 italic text-center">
          Kickoff: {formatKickoff(match.dateTime)}
        </p>
      </div>

      {/* ── ACTION INTERACTION BUTTONS (VOTE / LIVE STREAM) ───────────────── */}
      <div className="p-4 flex flex-col sm:flex-row gap-2.5 bg-slate-950/20">
        {/* Expand Vote Button */}
        <button
          onClick={() => {
            setIsVotingExpanded(!isVotingExpanded);
            setVotingMessage({ type: "", text: "" });
          }}
          className={`flex-1 font-black uppercase tracking-widest text-xs py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border select-none cursor-pointer ${
            isVotingExpanded
              ? "bg-slate-800 text-white border-slate-700 shadow-inner"
              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
          }`}
        >
          <span>🏆</span>
          <span>
            {isVotingExpanded 
              ? "Hide Prediction Form" 
              : userVote 
              ? "Your Saved Prediction" 
              : "Predict & Vote"}
          </span>
        </button>

        {/* Live Stream Button */}
        {match.liveStreamUrl && (
          <a
            href={match.liveStreamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 font-black uppercase tracking-widest text-xs py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white border border-red-500 shadow-[0_4px_12px_rgba(239,68,68,0.3)] select-none cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <span>Watch Live Stream</span>
          </a>
        )}
      </div>

      {/* ── COLLAPSIBLE PREDICTION FORM (EXPANDABLE) ────────────────────── */}
      {isVotingExpanded && (
        <div className="px-4 pb-5 border-t border-slate-900/60 pt-4 bg-slate-950/35 space-y-4">
          <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-200">
                {userVote ? "Your Saved Prediction" : "Predict the Winner &amp; Score!"}
              </h5>
            </div>

            <form onSubmit={handleVoteSubmit} className="space-y-3">
              {/* Options stacked vertically */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWinner("Egypt")}
                  className={`p-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-3 w-full text-left cursor-pointer ${
                    selectedWinner === "Egypt"
                      ? "bg-emerald-600/35 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                      : "bg-slate-950/60 border-slate-850 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <span className="text-xl leading-none wavy-flag-egypt">🇪🇬</span>
                  <span>Egypt wins</span>
                  {selectedWinner === "Egypt" && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedWinner("Draw")}
                  className={`p-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-3 w-full text-left cursor-pointer ${
                    selectedWinner === "Draw"
                      ? "bg-slate-700/40 border-slate-600 text-white shadow-lg shadow-white/5"
                      : "bg-slate-950/60 border-slate-850 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <span className="text-xl leading-none">🤝</span>
                  <span>Draw</span>
                  {selectedWinner === "Draw" && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedWinner("Iran")}
                  className={`p-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-3 w-full text-left cursor-pointer ${
                    selectedWinner === "Iran"
                      ? "bg-emerald-600/35 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                      : "bg-slate-950/60 border-slate-850 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <span className="text-xl leading-none wavy-flag-iran">🇮🇷</span>
                  <span>Iran wins</span>
                  {selectedWinner === "Iran" && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                </button>
              </div>

              {/* Score inputs */}
              <div className="flex items-center justify-between gap-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Predicted Score (Optional)
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="15"
                    placeholder="0"
                    value={predictScoreEgypt}
                    onChange={(e) => setPredictScoreEgypt(e.target.value)}
                    className="w-10 p-1 bg-slate-900 border border-slate-700 rounded text-center text-xs font-extrabold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white"
                  />
                  <span className="text-slate-500 font-bold">-</span>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    placeholder="0"
                    value={predictScoreIran}
                    onChange={(e) => setPredictScoreIran(e.target.value)}
                    className="w-10 p-1 bg-slate-900 border border-slate-700 rounded text-center text-xs font-extrabold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white"
                  />
                </div>
              </div>

              {votingMessage.text && (
                <div className={`p-2 rounded text-[10px] font-bold flex items-center gap-1.5 ${
                  votingMessage.type === "success" 
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                }`}>
                  {votingMessage.type === "error" ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <Check className="w-3.5 h-3.5 shrink-0" />}
                  <span>{votingMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingVote}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider text-xs py-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(16,185,129,0.2)] disabled:opacity-50"
              >
                {isSubmittingVote ? (
                  <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                ) : (
                  <>
                    <span>{userVote ? "Update Prediction" : "Submit Prediction"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── ADMIN ONLY SECTION (PREDICTIONS BOARD & SETTINGS) ──────────────── */}
      {isAdmin && (
        <div className="border-t border-slate-900 bg-slate-950/60">
          <button
            onClick={() => {
              setIsAdminDashboardExpanded(!isAdminDashboardExpanded);
              if (!isAdminDashboardExpanded) {
                fetchVoters();
              }
            }}
            className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-extrabold text-amber-400 hover:bg-slate-900/40 select-none cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              👑 <span>Admin Predictions Board &amp; Config</span>
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              {isAdminDashboardExpanded ? "Hide Panel" : "Show Panel"}
            </span>
          </button>

          {isAdminDashboardExpanded && (
            <div className="p-4 border-t border-slate-900 bg-slate-950/80 space-y-4">
              {/* Mini Navigation inside Admin Panel */}
              <div className="flex gap-2 border-b border-slate-850 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("voters")}
                  className={`px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-black transition-all ${
                    activeTab === "voters"
                      ? "bg-amber-500 text-slate-950 font-black"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  👥 Predictors
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("results")}
                  className={`px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-black transition-all ${
                    activeTab === "results"
                      ? "bg-amber-500 text-slate-950 font-black"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  📊 Breakdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("admin")}
                  className={`px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-black transition-all ${
                    activeTab === "admin"
                      ? "bg-amber-500 text-slate-950 font-black"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  ⚙️ Configure
                </button>
              </div>

              {/* TAB CONTENT 1: VOTERS (WHO VOTED WHAT) */}
              {activeTab === "voters" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      voter spreadsheet
                    </span>
                    <button
                      type="button"
                      onClick={fetchVoters}
                      className="text-[8px] font-black bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-0.5 rounded cursor-pointer uppercase tracking-wider text-slate-300"
                    >
                      Refresh
                    </button>
                  </div>

                  {loadingVoters ? (
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mb-2" />
                      <span className="text-[10px] font-bold text-slate-400">Loading Voters...</span>
                    </div>
                  ) : votersList.length === 0 ? (
                    <p className="text-[10px] font-semibold italic text-slate-500 text-center py-6">
                      No predictions cast yet...
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[10.5px]">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase">
                            <th className="pb-1.5">User</th>
                            <th className="pb-1.5 text-center">Predicts</th>
                            <th className="pb-1.5 text-right">Score Guess</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {votersList.map((vote) => (
                            <tr key={vote.username} className="hover:bg-slate-900/30">
                              <td className="py-2 font-bold text-white uppercase tracking-tight">
                                {vote.username}
                              </td>
                              <td className="py-2 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${
                                  vote.winner === "Egypt"
                                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                    : vote.winner === "Iran"
                                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                    : "bg-slate-800 text-slate-300 border-slate-700"
                                }`}>
                                  {vote.winner === "Egypt" ? "🇪🇬 Egypt" : vote.winner === "Iran" ? "🇮🇷 Iran" : "🤝 Draw"}
                                </span>
                              </td>
                              <td className="py-2 text-right font-black text-amber-400 font-mono">
                                {vote.score || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT 2: BREAKDOWN PERCENTAGES */}
              {activeTab === "results" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Aggregate Statistics
                    </span>
                    <span className="text-[9px] font-black bg-slate-800 border border-slate-750 px-2 py-0.5 rounded text-amber-400">
                      {votesSummary.total} Total Votes
                    </span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {/* Egypt */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-black uppercase">
                        <span className="flex items-center gap-1.5">
                          <span className="wavy-flag-egypt">🇪🇬</span> Egypt
                        </span>
                        <span className="text-emerald-400">{egyptPct}% ({votesSummary.egypt})</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                          style={{ width: `${egyptPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Draw */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-black uppercase">
                        <span className="flex items-center gap-1.5">
                          <span>🤝</span> Draw
                        </span>
                        <span className="text-slate-300">{drawPct}% ({votesSummary.draw})</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                        <div 
                          className="h-full bg-slate-500 rounded-full transition-all duration-500" 
                          style={{ width: `${drawPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Iran */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-black uppercase">
                        <span className="flex items-center gap-1.5">
                          <span className="wavy-flag-iran">🇮🇷</span> Iran
                        </span>
                        <span className="text-emerald-400">{iranPct}% ({votesSummary.iran})</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                          style={{ width: `${iranPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 3: CONFIGURE (ADMIN SETTINGS) */}
              {activeTab === "admin" && (
                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    {/* Match Title */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Match Title
                      </label>
                      <input
                        type="text"
                        placeholder="Egypt vs Iran — FIFA World Cup"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                        required
                      />
                    </div>

                    {/* Kickoff Local Time in Prague */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Kickoff Date &amp; Time (Prague Time)
                      </label>
                      <input
                        type="datetime-local"
                        value={formDateTime}
                        onChange={(e) => setFormDateTime(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                        required
                      />
                    </div>

                    {/* Live Stream URL */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Live Stream Link (Controlled from Admin Panel)
                      </label>
                      <input
                        type="url"
                        placeholder="https://youtube.com/..."
                        value={formLiveStream}
                        onChange={(e) => setFormLiveStream(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                      />
                    </div>
                  </div>

                  {adminMessage.text && (
                    <div className={`p-2 rounded text-[10px] font-bold flex items-center gap-1.5 ${
                      adminMessage.type === "success" 
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}>
                      {adminMessage.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      <span>{adminMessage.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-wider text-xs py-2 rounded-lg transition-colors cursor-pointer text-center block font-bold shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
                  >
                    Save Event Settings
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
