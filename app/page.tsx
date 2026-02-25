"use client";

import { useState, useEffect } from "react";
import { employees, departments } from "@/data/employees";
import { AttendanceStatus } from "@/lib/types";
import { SummaryCards } from "@/components/summary-cards";
import { FieldAccordion } from "@/components/field-accordion";
import { ReportBox } from "@/components/report-box";
import { ReportDetailView } from "@/components/report-detail-view";
import { Button } from "@/components/ui/button";
import { Monitor, HelpCircle } from "lucide-react";
import Image from "next/image";

const ADMIN_PASSWORD = "Bpad2026";
const ADMIN_NAMES = [
  "Aprianus Aryantho Rondak, S.STP",
  "Kristoforus R. Hayong, S.Kom., MM",
  "Marselinus Tahu Tetik",
  "Joachim A. K. Ulin, SM",
  "Sandy A. J. L. Pranadjaya, SH",
  "Melkisedek Koa, A.Md",
];

export default function Home() {
  const [attendanceData, setAttendanceData] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [showReport, setShowReport] = useState(false);
  const [showDetailReport, setShowDetailReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isDisplayMode, setIsDisplayMode] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [selectedAdminName, setSelectedAdminName] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [loggedAdminName, setLoggedAdminName] = useState("");
  const [loginError, setLoginError] = useState("");

  // Initialize attendance data from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setCurrentDate(today);

    const storageKey = `attendance-${today}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        setAttendanceData(JSON.parse(stored));
      } catch {
        initializeAttendance();
      }
    } else {
      initializeAttendance();
    }
  }, []);

  useEffect(() => {
    const storedAdmin = localStorage.getItem("logged-admin-name");
    if (storedAdmin && ADMIN_NAMES.includes(storedAdmin)) {
      setLoggedAdminName(storedAdmin);
      setSelectedAdminName(storedAdmin);
    }
  }, []);

  // Initialize all employees as "terlambat"
  const initializeAttendance = () => {
    const initial: Record<string, AttendanceStatus> = {};
    employees.forEach((emp) => {
      initial[emp.id] = "terlambat";
    });
    setAttendanceData(initial);
  };

  // Save to localStorage whenever attendance changes
  useEffect(() => {
    if (currentDate && Object.keys(attendanceData).length > 0) {
      const storageKey = `attendance-${currentDate}`;
      localStorage.setItem(storageKey, JSON.stringify(attendanceData));
    }
  }, [attendanceData, currentDate]);

  const handleStatusChange = (employeeId: string, status: AttendanceStatus) => {
    setAttendanceData((prev) => ({
      ...prev,
      [employeeId]: status,
    }));
  };

  const handleSetAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    employees.forEach((emp) => {
      updated[emp.id] = "hadir";
    });
    setAttendanceData(updated);
  };

  const handleReset = () => {
    initializeAttendance();
  };

  const handleAdminLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAdminName) {
      setLoginError("Pilih nama petugas terlebih dahulu.");
      return;
    }

    if (adminPasswordInput !== ADMIN_PASSWORD) {
      setLoginError("Password salah.");
      return;
    }

    setLoggedAdminName(selectedAdminName);
    localStorage.setItem("logged-admin-name", selectedAdminName);
    setLoginError("");
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("logged-admin-name");
    setLoggedAdminName("");
    setAdminPasswordInput("");
    setLoginError("");
  };

  // Calculate statistics
  const stats = {
    total: employees.length,
    hadir:
      Object.values(attendanceData).filter((s) => s === "hadir").length || 0,
    sakit:
      Object.values(attendanceData).filter((s) => s === "sakit").length || 0,
    izin:
      Object.values(attendanceData).filter((s) => s === "izin").length || 0,
    cuti:
      Object.values(attendanceData).filter((s) => s === "cuti").length || 0,
    terlambat:
      Object.values(attendanceData).filter((s) => s === "terlambat").length || 0,
    tugas:
      Object.values(attendanceData).filter((s) => s === "tugas").length || 0,
    tubel:
      Object.values(attendanceData).filter((s) => s === "tubel").length || 0,
  };

  const totalKurang =
    stats.total - stats.hadir >= 0 ? stats.total - stats.hadir : 0;

  const reportDate = currentDate
    ? new Date(currentDate).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "-";

  const summaryStats = {
    total: stats.total,
    hadir: stats.hadir,
    kurang: totalKurang,
    sakit: stats.sakit,
    izin: stats.izin,
    cuti: stats.cuti,
    terlambat: stats.terlambat,
    tugas: stats.tugas,
    tubel: stats.tubel,
  };

  const absentStatusLabels: Record<AttendanceStatus, string> = {
    hadir: "Hadir",
    sakit: "Sakit",
    izin: "Izin",
    cuti: "Cuti",
    terlambat: "Terlambat",
    tugas: "Tugas",
    tubel: "Tubel",
  };

  const absentByDepartment = departments
    .map((department) => {
      const employeesInDepartment = employees
        .filter((emp) => emp.department === department)
        .filter((emp) => (attendanceData[emp.id] || "terlambat") !== "hadir")
        .map((emp) => {
          const status = attendanceData[emp.id] || "terlambat";
          return {
            name: emp.name,
            status: absentStatusLabels[status],
          };
        });

      return {
        department,
        employees: employeesInDepartment,
      };
    })
    .filter((item) => item.employees.length > 0);

  // Generate report text
  const reportText = `Tanggal : ${reportDate}
Petugas : ${loggedAdminName || "-"}
Jumlah : ${stats.total}
Kurang : ${totalKurang}
Hadir : ${stats.hadir}
Keterangan :
- Sakit : ${stats.sakit}
- Izin : ${stats.izin}
- Cuti : ${stats.cuti}
- Terlambat : ${stats.terlambat}
- Tugas : ${stats.tugas}
- Tubel : ${stats.tubel}`;

  if (showDetailReport) {
    return (
      <ReportDetailView
        reportText={reportText}
        attendanceData={attendanceData}
        currentDate={currentDate}
        onClose={() => setShowDetailReport(false)}
      />
    );
  }

  if (!loggedAdminName) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 md:p-8">
        <div className="max-w-md mx-auto mt-10">
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5 shadow-sm">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <Image
                  src="/logo-bpad.png"
                  alt="Logo BPAD Provinsi NTT"
                  width={64}
                  height={68}
                  className="h-16 w-16 object-contain"
                  priority
                />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Login Admin</h1>
              <p className="text-sm text-slate-600">
                Pilih nama petugas lalu masukkan password.
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Nama Petugas
                </label>
                <select
                  value={selectedAdminName}
                  onChange={(e) => setSelectedAdminName(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                >
                  <option value="">Pilih petugas</option>
                  {ADMIN_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                  placeholder="Masukkan password"
                />
              </div>

              {loginError && (
                <p className="text-sm text-red-600">{loginError}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Login
              </Button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  if (isDisplayMode) {
    return (
      <div className="w-full h-screen bg-white flex flex-col items-center justify-center p-3 md:p-8 overflow-hidden">
        <button
          onClick={() => setIsDisplayMode(false)}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-700"
        >
          ✕
        </button>
        <ReportBox
          summary={summaryStats}
          reportDateText={reportDate}
          officerName={loggedAdminName}
          isDisplayMode={true}
          absentByDepartment={absentByDepartment}
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/logo-bpad.png"
              alt="Logo BPAD Provinsi NTT"
              width={72}
              height={76}
              className="h-16 w-16 md:h-[72px] md:w-[72px] object-contain"
              priority
            />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900 md:text-4xl">
                Absensi Apel Pagi BPAD Provinsi NTT
              </h1>
              <p className="text-slate-600">
                {new Date(currentDate).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-slate-600">
                Petugas: <span className="font-semibold">{loggedAdminName}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowGuide(true)}
              variant="outline"
              className="bg-transparent"
            >
              <HelpCircle className="w-5 h-5 mr-2" />
              Panduan
            </Button>
            <Button
              onClick={handleAdminLogout}
              variant="outline"
              className="bg-transparent"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards
          total={stats.total}
          hadir={stats.hadir}
          sakit={stats.sakit}
          izin={stats.izin}
          cuti={stats.cuti}
          terlambat={stats.terlambat}
          tugas={stats.tugas}
          tubel={stats.tubel}
        />

        {/* Action Buttons - Sticky */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-slate-50 to-white pb-4 mb-4 flex flex-wrap gap-3 pt-4 border-b border-slate-200">
          <Button
            onClick={handleSetAllPresent}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Set Semua Hadir
          </Button>
          <Button onClick={handleReset} variant="outline" className="bg-transparent">
            Reset
          </Button>
          <Button
            onClick={() => setShowReportModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Generate Laporan Apel
          </Button>
          <Button
            onClick={() => setIsDisplayMode(true)}
            variant="outline"
            className="ml-auto bg-transparent"
          >
            <Monitor className="w-4 h-4 mr-2" />
            Layar Apel
          </Button>
        </div>

        {/* Attendance Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Daftar Pegawai
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">ASN</h3>
              {departments.map((dept) => (
                <FieldAccordion
                  key={`asn-${dept}`}
                  department={dept}
                  employees={employees}
                  attendanceData={attendanceData}
                  onStatusChange={handleStatusChange}
                  employmentType="ASN"
                />
              ))}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">PPPK</h3>
              {departments.map((dept) => (
                <FieldAccordion
                  key={`pppk-${dept}`}
                  department={dept}
                  employees={employees}
                  attendanceData={attendanceData}
                  onStatusChange={handleStatusChange}
                  employmentType="PPPK"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Report */}
        {showReport && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                Laporan
              </h2>
              <button
                onClick={() => setShowReport(false)}
                className="text-slate-500 hover:text-slate-700 text-xl"
              >
                ✕
              </button>
            </div>
            <ReportBox
              summary={summaryStats}
              reportDateText={reportDate}
              officerName={loggedAdminName}
              absentByDepartment={absentByDepartment}
            />
          </div>
        )}

        {/* Report Generation Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col min-h-0">
              <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Laporan Apel Pagi
                  </h2>
                  <p className="text-slate-600">
                    {new Date(currentDate).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <ReportBox
                  summary={summaryStats}
                  reportDateText={reportDate}
                  officerName={loggedAdminName}
                  absentByDepartment={absentByDepartment}
                />
              </div>
              <div className="flex gap-3 p-6 pt-0 border-t border-slate-200 shrink-0">
                <Button
                  onClick={() => {
                    setShowReportModal(false);
                    setShowDetailReport(true);
                  }}
                  variant="outline"
                  className="flex-1 bg-transparent"
                >
                  Lihat Detail & Export
                </Button>
                <Button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Usage Guide Modal */}
        {showGuide && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  Cara Menggunakan Aplikasi
                </h2>
                <button
                  onClick={() => setShowGuide(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold text-lg min-w-[32px]">
                      1.
                    </span>
                    <p className="text-slate-700 pt-1">
                      <span className="font-semibold">Buka aplikasi, klik Reset.</span>
                      <br />
                      Pastikan semua pegawai dalam status default (Terlambat) sebelum memulai absensi.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold text-lg min-w-[32px]">
                      2.
                    </span>
                    <p className="text-slate-700 pt-1">
                      <span className="font-semibold">
                        Panggil pegawai mulai dari Sekretariat sampai Aset 2.
                      </span>
                      <br />
                      Centang pegawai yang hadir, atau pilih status lain (Sakit, Izin, Terlambat, Tugas, Tubel) sesuai kebutuhan.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold text-lg min-w-[32px]">
                      3.
                    </span>
                    <p className="text-slate-700 pt-1">
                      <span className="font-semibold">Klik Generate Laporan.</span>
                      <br />
                      Sistem akan membuat laporan resmi dengan rincian jumlah pegawai per status.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold text-lg min-w-[32px]">
                      4.
                    </span>
                    <p className="text-slate-700 pt-1">
                      <span className="font-semibold">
                        Layar Apel: gunakan untuk menyampaikan laporan ke pemimpin apel pagi,
                      </span>
                      <br />
                      agar dapat diteruskan ke pembina apel pagi.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold text-lg min-w-[32px]">
                      5.
                    </span>
                    <p className="text-slate-700 pt-1">
                      <span className="font-semibold">
                        Jika butuh PDF, scroll ke bawah, klik Export PDF,
                      </span>
                      <br />
                      lalu kirim ke Kasubag Kepegawaian.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">💡 Tip:</span> Data absensi disimpan secara otomatis untuk hari yang sama. Anda dapat menutup aplikasi dan membukanya kembali tanpa kehilangan data.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 p-6 bg-slate-50 flex justify-end">
                <Button
                  onClick={() => setShowGuide(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Mengerti
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
