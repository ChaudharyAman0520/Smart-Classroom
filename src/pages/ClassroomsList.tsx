import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Classroom } from "../types";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import ClassroomCard from "../components/ClassroomCard";
import { School, Search, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function ClassroomsList() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchClassrooms = async () => {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      const response = await axios.get(`/api/classrooms?userId=${user.id}`);
      setClassrooms(response.data);
    } catch (e: any) {
      console.error(e);
      setErr("Failed to load classrooms dataset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, [user]);

  if (loading) {
    return <Loader message="Retrieving list of classrooms..." />;
  }

  if (err && classrooms.length === 0) {
    return <ErrorMessage message={err} onRetry={fetchClassrooms} />;
  }

  const isTeacher = user?.role === "teacher";

  // Filter classrooms by active typing search terms
  const filteredClassrooms = classrooms.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 font-sans select-none" id="classrooms-list-page">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Academic Classrooms
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Browse and coordinate directories of interactive lectures.
          </p>
        </div>

        {isTeacher && (
          <Link
            to="/create-classroom"
            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            Add Classroom
          </Link>
        )}
      </div>

      {/* Filter and search panels */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm rounded-xl shadow-xs">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search class codes, titles, or subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition bg-slate-50/50"
          />
        </div>
        <div className="text-xs font-semibold text-slate-400">
          Total Classrooms: <strong>{filteredClassrooms.length}</strong>
        </div>
      </div>

      {/* Grid items */}
      {filteredClassrooms.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <School className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold text-base">No matching classrooms found.</p>
          <p className="text-slate-400 text-xs mt-1">
            {searchTerm ? "Try clearing or reflowing search filters." : "You do not have any registered classrooms."}
          </p>
          {isTeacher && !searchTerm && (
            <Link
              to="/create-classroom"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 underline"
            >
              Establish your first class roster right now
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClassrooms.map((c) => (
            <ClassroomCard key={c.id} classroom={c} role={user?.role || "student"} />
          ))}
        </div>
      )}
    </div>
  );
}
