import React, { useState, useEffect, FormEvent } from "react";
import { useApp } from "../context/AppContext";
import * as confetti from 'canvas-confetti';
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
import { readJSON, writeJSON } from "../utils/github";

export default function WorldCupCard() {
  // ... (rest of state)
  const { currentUser } = useApp() as any;
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<any>({
    title: "Egypt vs Iran — FIFA World Cup",
    dateTime: "2026-06-26T21:00:00",
    liveStreamUrl: "",
    isFinalized: false,
    actualWinner: "",
    actualScore: "",
    celebrateEgyptWins: false
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

  // Admin settings
  const [isFinalized, setIsFinalized] = useState(false);
  const [actualWinner, setActualWinner] = useState<"Egypt" | "Iran" | "Draw" | "">("");
  const [actualScoreEgypt, setActualScoreEgypt] = useState("");
  const [actualScoreIran, setActualScoreIran] = useState("");
  const [celebrateEgyptWins, setCelebrateEgyptWins] = useState(false);

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

  // Celebration
  useEffect(() => {
    if (celebrateEgyptWins && actualWinner === "Egypt" && isFinalized) {
       (confetti as any)({
         particleCount: 150,
         spread: 70,
         origin: { y: 0.6 }
       });
    }
  }, [celebrateEgyptWins, actualWinner, isFinalized]);

  const username = currentUser?.username || "";
  const isAdmin = currentUser?.role === "admin";

  // Fetch match details and predictions from GitHub
  const fetchMatchData = async () => {
    try {
      // 1. Fetch match configuration
      const matchResult = await readJSON("worldcup_match.json") as any;
      let activeMatch: any = {
        title: "Egypt vs Iran — FIFA World Cup",
        dateTime: "2026-06-26T21:00:00",
        liveStreamUrl: "",
        isFinalized: false,
        actualWinner: "",
        actualScore: "",
        celebrateEgyptWins: false
      };
      if (matchResult && !Array.isArray(matchResult)) {
        activeMatch = matchResult;
      } else if (Array.isArray(matchResult) && matchResult.length > 0) {
        activeMatch = matchResult[0];
      }
      setMatch(activeMatch);

      // Pre-populate admin fields
      setFormTitle(activeMatch.title);
      setFormDateTime(activeMatch.dateTime);
      setFormLiveStream(activeMatch.liveStreamUrl || "");
      setIsFinalized(activeMatch.isFinalized || false);
      setActualWinner(activeMatch.actualWinner || "");
      setCelebrateEgyptWins(activeMatch.celebrateEgyptWins || false);
      if (activeMatch.actualScore && activeMatch.actualScore.includes("-")) {
        const parts = activeMatch.actualScore.split("-");
        setActualScoreEgypt(parts[0].trim());
        setActualScoreIran(parts[1].trim());
      }

      // 2. Fetch predictions
      const predictions = await readJSON("worldcup_predictions.json") || [];
      const predictionsArray = Array.isArray(predictions) ? predictions : [];

      // 3. Calculate summary
      const summary = { egypt: 0, iran: 0, draw: 0, total: 0 };
      predictionsArray.forEach((vote: any) => {
        if (vote && vote.winner) {
          summary.total++;
          const winnerLower = vote.winner.toLowerCase();
          if (winnerLower === "egypt") summary.egypt++;
          else if (winnerLower === "iran") summary.iran++;
          else if (winnerLower === "draw") summary.draw++;
        }
      });
      setVotesSummary(summary);

      // 4. Find current user's vote
      if (username) {
        const userVoteItem = predictionsArray.find(
          (p: any) => p && p.username && p.username.toLowerCase() === username.toLowerCase()
        );
        setUserVote(userVoteItem || null);

        // Pre-populate voter fields if voted
        if (userVoteItem) {
          setSelectedWinner(userVoteItem.winner);
          if (userVoteItem.score && userVoteItem.score.includes("-")) {
            const parts = userVoteItem.score.split("-");
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
      const predictions = await readJSON("worldcup_predictions.json") || [];
      setVotersList(Array.isArray(predictions) ? predictions : []);
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

    console.log("Submitting vote:", { selectedWinner, predictScoreEgypt, predictScoreIran });
    const scoreEgypt = predictScoreEgypt ? predictScoreEgypt.trim() : "";
    const scoreIran = predictScoreIran ? predictScoreIran.trim() : "";
    const scoreStr = (scoreEgypt !== "" && scoreIran !== "") 
      ? `${scoreEgypt}-${scoreIran}`
      : "";
    console.log("Calculated scoreStr:", scoreStr);

    try {
      const predictions = await readJSON("worldcup_predictions.json") || [];
      const predictionsArray = Array.isArray(predictions) ? predictions : [];

      const lowerUsername = username.trim().toLowerCase();
      const existingIndex = predictionsArray.findIndex(
        (p: any) => p && p.username && p.username.toLowerCase() === lowerUsername
      );

      const voteData = {
        username: lowerUsername,
        winner: selectedWinner,
        score: scoreStr,
        updatedAt: Date.now()
      };

      if (existingIndex > -1) {
        console.log("Updating existing prediction at index:", existingIndex);
        predictionsArray[existingIndex] = voteData;
      } else {
        console.log("Adding new prediction");
        predictionsArray.push(voteData);
      }

      console.log("Saving predictionsArray:", predictionsArray);
      await writeJSON("worldcup_predictions.json", predictionsArray);
      setVotingMessage({ type: "success", text: "Prediction successfully saved! 🎉" });
      await fetchMatchData();
    } catch (err: any) {
      console.error("Failed to submit prediction:", err);
      setVotingMessage({ type: "error", text: "Failed to save prediction: " + (err.message || String(err)) });
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // Submit Admin settings
  const handleAdminSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAdminMessage({ type: "", text: "" });

    try {
      const updatedMatch = {
        title: (formTitle || "Egypt vs Iran — FIFA World Cup").trim(),
        dateTime: (formDateTime || "2026-06-26T21:00:00").trim(),
        liveStreamUrl: (formLiveStream || "").trim(),
        isFinalized,
        actualWinner,
        actualScore: (actualScoreEgypt.trim() !== "" && actualScoreIran.trim() !== "") 
          ? `${actualScoreEgypt.trim()}-${actualScoreIran.trim()}`
          : "",
        celebrateEgyptWins,
      };

      await writeJSON("worldcup_match.json", updatedMatch);
      setAdminMessage({ type: "success", text: "Match settings updated successfully!" });
      await fetchMatchData();
    } catch (err: any) {
      console.error("Failed to update match settings:", err);
      setAdminMessage({ type: "error", text: "Failed to update match settings: " + (err.message || String(err)) });
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
      <div className="bg-emerald-900 rounded-2xl border border-white/20 p-6 flex flex-col items-center justify-center min-h-[220px]">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-bold text-emerald-100">Retrieving Match Details...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-800 via-green-800 to-emerald-950 text-white rounded-2xl border border-white/25 shadow-xl overflow-hidden relative group transition-all duration-300 hover:shadow-2xl hover:border-white/40">
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

      {/* ── CENTRAL MATCH DISPLAY (REPRESENTING SOCCER PITCH/PLAYGROUND MARKINGS) ───────────────────────── */}
      <div className="relative overflow-hidden flex items-center justify-center gap-6 sm:gap-12 py-10 px-5 bg-black/20 border-b border-white/25">
        
        {/* --- Pitch Markings --- */}
        {/* Halfway line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/20 -translate-x-1/2 pointer-events-none" />
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border-2 border-white/25 pointer-events-none" />
        {/* Center spot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/50 pointer-events-none" />
        
        {/* Left goal area / box */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-28 border-y-2 border-r-2 border-white/20 pointer-events-none" />
        {/* Left penalty arc */}
        <div className="absolute left-7 top-1/2 -translate-y-1/2 w-8 h-16 rounded-full border-2 border-white/15 border-l-0 pointer-events-none" />
        
        {/* Right goal area / box */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-28 border-y-2 border-l-2 border-white/20 pointer-events-none" />
        {/* Right penalty arc */}
        <div className="absolute right-7 top-1/2 -translate-y-1/2 w-8 h-16 rounded-full border-2 border-white/15 border-r-0 pointer-events-none" />

        {/* --- Teams (Absolute overlayed) --- */}
        {/* Egypt */}
        <div className="flex flex-col items-center flex-1 text-center z-10">
          <div className="text-6xl sm:text-7xl select-none wavy-flag wavy-flag-egypt mb-3 leading-none font-sans">
            🇪🇬
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] bg-black/35 px-2 py-0.5 rounded-full">
            Egypt
          </span>
        </div>

        {/* VS Badge */}
        <div className="flex flex-col items-center shrink-0 z-10">
          <div className="px-3 py-1 rounded-full bg-emerald-950 border border-white/40 text-[10px] font-black text-amber-300 tracking-widest uppercase shadow-md drop-shadow-md">
            VS
          </div>
        </div>

        {/* Iran */}
        <div className="flex flex-col items-center flex-1 text-center z-10">
          <div className="text-6xl sm:text-7xl select-none wavy-flag wavy-flag-iran mb-3 leading-none font-sans">
            🇮🇷
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] bg-black/35 px-2 py-0.5 rounded-full">
            Iran
          </span>
        </div>
      </div>

      {/* ── COUNTDOWN TIMER (ALWAYS VISIBLE BELOW MATCH DETAILS) ─────────── */}
      <div className="p-5 flex flex-col items-center border-b border-white/20 bg-black/10">
        <div className="text-[9px] font-black uppercase tracking-widest text-emerald-200 mb-2.5 flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-amber-300" />
          <span>Match Kickoff Countdown</span>
        </div>

        {!timeLeft.isOver ? (
          <div className="flex items-center justify-center gap-3">
            {/* Days */}
            <div className="flex flex-col items-center">
              <div className="bg-black/35 text-white font-black text-lg px-2.5 py-1.5 rounded-lg min-w-[38px] text-center border border-white/20 shadow-md">
                {String(timeLeft.days).padStart(2, "0")}
              </div>
              <span className="text-[7px] font-bold tracking-widest text-emerald-200 uppercase mt-1">Days</span>
            </div>
            <span className="text-lg font-bold text-amber-300 select-none -mt-4 animate-pulse">:</span>

            {/* Hours */}
            <div className="flex flex-col items-center">
              <div className="bg-black/35 text-white font-black text-lg px-2.5 py-1.5 rounded-lg min-w-[38px] text-center border border-white/20 shadow-md">
                {String(timeLeft.hours).padStart(2, "0")}
              </div>
              <span className="text-[7px] font-bold tracking-widest text-emerald-200 uppercase mt-1">Hours</span>
            </div>
            <span className="text-lg font-bold text-amber-300 select-none -mt-4 animate-pulse">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <div className="bg-black/35 text-white font-black text-lg px-2.5 py-1.5 rounded-lg min-w-[38px] text-center border border-white/20 shadow-md">
                {String(timeLeft.minutes).padStart(2, "0")}
              </div>
              <span className="text-[7px] font-bold tracking-widest text-emerald-200 uppercase mt-1">Mins</span>
            </div>
            <span className="text-lg font-bold text-amber-300 select-none -mt-4 animate-pulse">:</span>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <div className="bg-black/35 text-white font-black text-lg px-2.5 py-1.5 rounded-lg min-w-[38px] text-center border border-white/20 shadow-md text-amber-300">
                {String(timeLeft.seconds).padStart(2, "0")}
              </div>
              <span className="text-[7px] font-bold tracking-widest text-emerald-200 uppercase mt-1">Secs</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/35 px-3 py-1.5 rounded-full text-red-200 font-extrabold text-[9px] uppercase tracking-wider animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 block animate-ping" />
            <span>Match is Live / Concluded</span>
          </div>
        )}

        <p className="text-[9px] font-semibold text-emerald-100 mt-3 italic text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
          Kickoff: {formatKickoff(match.dateTime)}
        </p>
      </div>

      {/* ── ACTION INTERACTION BUTTONS (VOTE / LIVE STREAM) ───────────────── */}
      <div className="p-4 flex flex-col sm:flex-row gap-2.5 bg-black/15 border-b border-white/15">
        {/* Expand Vote Button */}
        <button
          onClick={() => {
            setIsVotingExpanded(!isVotingExpanded);
            setVotingMessage({ type: "", text: "" });
          }}
          className={`flex-1 font-black uppercase tracking-widest text-xs py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border select-none cursor-pointer ${
            isVotingExpanded
              ? "bg-black/30 text-white border-white/20 shadow-inner"
              : "bg-amber-400 hover:bg-amber-300 text-emerald-950 border-amber-300 shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
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
            className="flex-1 font-black uppercase tracking-widest text-xs py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white border border-white/20 shadow-[0_4px_12px_rgba(239,68,68,0.3)] select-none cursor-pointer"
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
        <div className="px-4 pb-5 border-b border-white/15 pt-4 bg-black/20 space-y-4">
          <div className="bg-black/25 rounded-xl p-4 border border-white/20 space-y-3">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <h5 className="text-[10px] font-black uppercase tracking-wider text-white">
                {userVote ? "Your Saved Prediction" : "Predict the Winner & Score!"}
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
                      ? "bg-white/25 border-white text-white shadow-lg"
                      : "bg-black/30 border-white/10 text-emerald-100 hover:border-white/30"
                  }`}
                >
                  <span className="text-xl leading-none wavy-flag-egypt">🇪🇬</span>
                  <span>Egypt wins</span>
                  {selectedWinner === "Egypt" && <Check className="w-4 h-4 text-amber-300 ml-auto animate-pulse" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedWinner("Draw")}
                  className={`p-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-3 w-full text-left cursor-pointer ${
                    selectedWinner === "Draw"
                      ? "bg-white/25 border-white text-white shadow-lg"
                      : "bg-black/30 border-white/10 text-emerald-100 hover:border-white/30"
                  }`}
                >
                  <span className="text-xl leading-none">🤝</span>
                  <span>Draw</span>
                  {selectedWinner === "Draw" && <Check className="w-4 h-4 text-amber-300 ml-auto animate-pulse" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedWinner("Iran")}
                  className={`p-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-3 w-full text-left cursor-pointer ${
                    selectedWinner === "Iran"
                      ? "bg-white/25 border-white text-white shadow-lg"
                      : "bg-black/30 border-white/10 text-emerald-100 hover:border-white/30"
                  }`}
                >
                  <span className="text-xl leading-none wavy-flag-iran">🇮🇷</span>
                  <span>Iran wins</span>
                  {selectedWinner === "Iran" && <Check className="w-4 h-4 text-amber-300 ml-auto animate-pulse" />}
                </button>
              </div>

              {/* Score inputs */}
              <div className="flex items-center justify-between gap-3 bg-black/20 p-2.5 rounded-lg border border-white/15">
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-100">
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
                    className="w-10 p-1 bg-black/40 border border-white/25 rounded text-center text-xs font-extrabold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white"
                  />
                  <span className="text-white/60 font-bold">-</span>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    placeholder="0"
                    value={predictScoreIran}
                    onChange={(e) => setPredictScoreIran(e.target.value)}
                    className="w-10 p-1 bg-black/40 border border-white/25 rounded text-center text-xs font-extrabold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white"
                  />
                </div>
              </div>

              {votingMessage.text && (
                <div className={`p-2 rounded text-[10px] font-bold flex items-center gap-1.5 ${
                  votingMessage.type === "success" 
                    ? "bg-white/20 text-white border border-white/30" 
                    : "bg-red-500/20 text-red-200 border border-red-500/30"
                }`}>
                  {votingMessage.type === "error" ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <Check className="w-3.5 h-3.5 shrink-0" />}
                  <span>{votingMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingVote}
                className="w-full bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black uppercase tracking-wider text-xs py-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(245,158,11,0.2)] disabled:opacity-50"
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
        <div className="border-t border-white/25 bg-black/30">
          <button
            onClick={() => {
              setIsAdminDashboardExpanded(!isAdminDashboardExpanded);
              if (!isAdminDashboardExpanded) {
                fetchVoters();
              }
            }}
            className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-extrabold text-amber-300 hover:bg-black/10 select-none cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              👑 <span>Admin Predictions Board &amp; Config</span>
            </span>
            <span className="text-[10px] bg-black/20 text-white px-2 py-0.5 rounded border border-white/25">
              {isAdminDashboardExpanded ? "Hide Panel" : "Show Panel"}
            </span>
          </button>

          {isAdminDashboardExpanded && (
            <div className="p-4 border-t border-white/25 bg-black/20 space-y-4">
              {/* Mini Navigation inside Admin Panel */}
              <div className="flex gap-2 border-b border-white/15 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("voters")}
                  className={`px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-black transition-all ${
                    activeTab === "voters"
                      ? "bg-amber-400 text-emerald-950 font-black"
                      : "bg-black/30 text-emerald-100 hover:text-white border border-white/10"
                  }`}
                >
                  👥 Predictors
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("results")}
                  className={`px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-black transition-all ${
                    activeTab === "results"
                      ? "bg-amber-400 text-emerald-950 font-black"
                      : "bg-black/30 text-emerald-100 hover:text-white border border-white/10"
                  }`}
                >
                  📊 Breakdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("admin")}
                  className={`px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-black transition-all ${
                    activeTab === "admin"
                      ? "bg-amber-400 text-emerald-950 font-black"
                      : "bg-black/30 text-emerald-100 hover:text-white border border-white/10"
                  }`}
                >
                  ⚙️ Configure
                </button>
              </div>

              {/* TAB CONTENT 1: VOTERS (WHO VOTED WHAT) */}
              {activeTab === "voters" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-emerald-200 uppercase tracking-widest">
                      voter spreadsheet
                    </span>
                    <button
                      type="button"
                      onClick={fetchVoters}
                      className="text-[8px] font-black bg-black/30 hover:bg-black/40 border border-white/20 px-2 py-0.5 rounded cursor-pointer uppercase tracking-wider text-white"
                    >
                      Refresh
                    </button>
                  </div>

                  {loadingVoters ? (
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mb-2" />
                      <span className="text-[10px] font-bold text-emerald-200">Loading Voters...</span>
                    </div>
                  ) : votersList.length === 0 ? (
                    <p className="text-[10px] font-semibold italic text-emerald-200/60 text-center py-6">
                      No predictions cast yet...
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[10.5px]">
                        <thead>
                          <tr className="border-b border-white/15 text-emerald-200 font-extrabold uppercase">
                            <th className="pb-1.5">User</th>
                            <th className="pb-1.5 text-center">Predicts</th>
                            <th className="pb-1.5 text-right">Score Guess</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {votersList.map((vote) => {
                            const isWinnerCorrect = isFinalized && actualWinner && vote.winner === actualWinner;
                            const isScoreCorrect = isFinalized && actualScoreEgypt && actualScoreIran && vote.score === `${actualScoreEgypt}-${actualScoreIran}`;

                            return (
                              <tr key={vote.username} className="hover:bg-white/5">
                                <td className="py-2 font-bold text-white uppercase tracking-tight">
                                  {vote.username}
                                </td>
                                <td className="py-2 text-center">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${isWinnerCorrect ? "bg-emerald-600 border-emerald-400" : "bg-black/20 border-white/20"} text-white`}>
                                    {vote.winner === "Egypt" ? "🇪🇬 Egypt" : vote.winner === "Iran" ? "🇮🇷 Iran" : "🤝 Draw"}
                                  </span>
                                </td>
                                <td className="py-2 text-right font-black text-amber-300 font-mono">
                                  <span className={isScoreCorrect ? "bg-emerald-600 text-white px-1.5 py-0.5 rounded" : ""}>
                                    {vote.score || "—"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
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
                    <span className="text-[9px] font-black text-emerald-200 uppercase tracking-widest">
                      Aggregate Statistics
                    </span>
                    <span className="text-[9px] font-black bg-black/20 border border-white/20 px-2 py-0.5 rounded text-amber-300">
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
                        <span className="text-amber-300">{egyptPct}% ({votesSummary.egypt})</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden border border-white/15">
                        <div 
                          className="h-full bg-amber-400 rounded-full transition-all duration-500" 
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
                        <span className="text-white/85">{drawPct}% ({votesSummary.draw})</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden border border-white/15">
                        <div 
                          className="h-full bg-white/70 rounded-full transition-all duration-500" 
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
                        <span className="text-amber-300">{iranPct}% ({votesSummary.iran})</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden border border-white/15">
                        <div 
                          className="h-full bg-amber-400 rounded-full transition-all duration-500" 
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
                  <div className="space-y-3 bg-black/20 p-3.5 rounded-xl border border-white/15">
                    {/* Match Title */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-emerald-200 block">
                        Match Title
                      </label>
                      <input
                        type="text"
                        placeholder="Egypt vs Iran — FIFA World Cup"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full p-2 bg-black/30 border border-white/20 rounded text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                        required
                      />
                    </div>

                    {/* Finalize Match */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isFinalized}
                          onChange={(e) => setIsFinalized(e.target.checked)}
                          className="accent-amber-400"
                        />
                        <span className="text-[10px] font-black uppercase tracking-wider text-white">Finalize Match Result</span>
                      </label>
                      {isFinalized && (
                        <div className="space-y-2 bg-black/30 p-3 rounded">
                          <label className="text-[10px] font-black uppercase tracking-wider text-emerald-200 block">Actual Winner</label>
                          <select 
                            value={actualWinner}
                            onChange={(e) => setActualWinner(e.target.value as any)}
                            className="w-full p-2 bg-black/30 border border-white/20 rounded text-xs text-white"
                          >
                            <option value="">Select Winner</option>
                            <option value="Egypt">Egypt</option>
                            <option value="Iran">Iran</option>
                            <option value="Draw">Draw</option>
                          </select>
                          <label className="text-[10px] font-black uppercase tracking-wider text-emerald-200 block">Actual Score</label>
                          <div className="flex gap-2">
                             <input type="number" value={actualScoreEgypt} onChange={(e) => setActualScoreEgypt(e.target.value)} className="w-full p-2 bg-black/30 border border-white/20 rounded text-xs text-white" placeholder="Egypt" />
                             <input type="number" value={actualScoreIran} onChange={(e) => setActualScoreIran(e.target.value)} className="w-full p-2 bg-black/30 border border-white/20 rounded text-xs text-white" placeholder="Iran" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Celebrate Egypt Wins */}
                    <div className="pt-2 border-t border-white/10">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={celebrateEgyptWins}
                          onChange={(e) => setCelebrateEgyptWins(e.target.checked)}
                          className="accent-amber-400"
                        />
                        <span className="text-[10px] font-black uppercase tracking-wider text-white">Celebrate Egypt Wins</span>
                      </label>
                    </div>

                    {/* Kickoff Local Time in Prague */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-emerald-200 block">
                        Kickoff Date &amp; Time (Prague Time)
                      </label>
                      <input
                        type="datetime-local"
                        value={formDateTime}
                        onChange={(e) => setFormDateTime(e.target.value)}
                        className="w-full p-2 bg-black/30 border border-white/20 rounded text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                        required
                      />
                    </div>

                    {/* Live Stream URL */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-emerald-200 block">
                        Live Stream Link (Controlled from Admin Panel)
                      </label>
                      <input
                        type="url"
                        placeholder="https://youtube.com/..."
                        value={formLiveStream}
                        onChange={(e) => setFormLiveStream(e.target.value)}
                        className="w-full p-2 bg-black/30 border border-white/20 rounded text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                      />
                    </div>
                  </div>

                  {adminMessage.text && (
                    <div className={`p-2 rounded text-[10px] font-bold flex items-center gap-1.5 ${
                      adminMessage.type === "success" 
                        ? "bg-white/20 text-white border border-white/35" 
                        : "bg-red-500/20 text-red-200 border border-red-500/30"
                    }`}>
                      {adminMessage.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      <span>{adminMessage.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black uppercase tracking-wider text-xs py-2 rounded-lg transition-colors cursor-pointer text-center block font-bold shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
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
