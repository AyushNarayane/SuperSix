import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { collection, query, orderBy, getDocs, where, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { QRScanner } from '../../components/QRScanner';

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName?: string;
  timestamp: Timestamp;
  status: string;
  branchId: string;
  dayId: string;
}

interface AttendanceDay {
  id: string;
  date: Timestamp;
  branchId: string;
}

interface Branch {
  id: string;
  name: string;
}

export const AttendanceManagement = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [attendanceDays, setAttendanceDays] = useState<AttendanceDay[]>([]);
  const [hasTodayAttendance, setHasTodayAttendance] = useState(false);

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!selectedBranch || !selectedDayId) return;

      const q = query(
        collection(db, 'attendance'),
        where('branchId', '==', selectedBranch),
        where('dayId', '==', selectedDayId),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const records: AttendanceRecord[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        // Fetch student name from users collection
        const studentDoc = await getDocs(query(
          collection(db, 'users'),
          where('uid', '==', data.studentId)
        ));

        const studentName = studentDoc.docs[0]?.data()?.name || 'Unknown Student';

        records.push({
          id: doc.id,
          studentId: data.studentId,
          studentName,
          timestamp: data.timestamp,
          status: data.status,
          branchId: data.branchId,
          dayId: data.dayId
        });
      }

      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    if (selectedBranch && selectedDayId) {
      fetchAttendanceRecords();
    }
  }, [selectedBranch, selectedDayId]);

  const fetchBranches = async () => {
    try {
      const branchesSnapshot = await getDocs(collection(db, 'branches'));
      const branchesData = branchesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setBranches(branchesData);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const createAttendanceDay = async () => {
    if (!selectedBranch) {
      alert('Please select a branch first');
      return;
    }

    try {
      const dayRef = await addDoc(collection(db, 'attendance_days'), {
        branchId: selectedBranch,
        date: Timestamp.now(),
        createdAt: Timestamp.now()
      });
      setSelectedDayId(dayRef.id);
    } catch (error) {
      console.error('Error creating attendance day:', error);
      alert('Failed to create attendance day');
    }
  };

  const fetchAttendanceDays = async () => {
    if (!selectedBranch) return;
    try {
      const q = query(
        collection(db, 'attendance_days'),
        where('branchId', '==', selectedBranch),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      const days = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceDay[];
      setAttendanceDays(days);

      // Check if there's an attendance day for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayExists = days.some(day => {
        const dayDate = day.date.toDate();
        dayDate.setHours(0, 0, 0, 0);
        return dayDate.getTime() === today.getTime();
      });
      setHasTodayAttendance(todayExists);
    } catch (error) {
      console.error('Error fetching attendance days:', error);
    }
  };

  useEffect(() => {
    if (selectedBranch) {
      fetchAttendanceDays();
      setSelectedDayId('');
    }
  }, [selectedBranch]);

  const handleScanSuccess = async (studentId: string) => {
    setShowScanner(false);
    await fetchAttendanceRecords(); // Refresh the list after new attendance
  };

  const formatTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderAttendanceRecord = ({ item }: { item: AttendanceRecord }) => (
    <View style={styles.recordCard}>
      <Text style={styles.studentName}>{item.studentName}</Text>
      <Text style={styles.timeText}>Time: {formatTime(item.timestamp)}</Text>
      <Text style={[styles.statusText, item.status === 'present' ? styles.presentText : styles.absentText]}>
        {item.status.toUpperCase()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {showScanner ? (
        <QRScanner
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleScanSuccess}
          branchId={selectedBranch}
          dayId={selectedDayId}
        />
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Attendance Management</Text>
            <View style={styles.controls}>
              <View style={styles.branchSelector}>
                <Text>Select Branch:</Text>
                {branches.map((branch) => (
                  <TouchableOpacity
                    key={branch.id}
                    style={[styles.branchButton, selectedBranch === branch.id && styles.selectedBranch]}
                    onPress={() => setSelectedBranch(branch.id)}
                  >
                    <Text style={[styles.branchButtonText, selectedBranch === branch.id && styles.selectedBranchText]}>{branch.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.daySelector}>
                <Text>Select Day:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {attendanceDays.map((day) => (
                    <TouchableOpacity
                      key={day.id}
                      style={[styles.dayButton, selectedDayId === day.id && styles.selectedDay]}
                      onPress={() => setSelectedDayId(day.id)}
                    >
                      <Text style={[styles.dayButtonText, selectedDayId === day.id && styles.selectedDayText]}>
                        {day.date.toDate().toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <TouchableOpacity
                style={[styles.createDayButton, hasTodayAttendance && styles.disabledButton]}
                onPress={createAttendanceDay}
                disabled={hasTodayAttendance}
              >
                <Text style={[styles.buttonText, hasTodayAttendance && styles.disabledButtonText]}>Create Day</Text>
              </TouchableOpacity>
              {selectedDayId && (
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => setShowScanner(true)}
                >
                  <Text style={styles.buttonText}>Scan QR</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {loading ? (
            <Text style={styles.loadingText}>Loading attendance records...</Text>
          ) : (
            <FlatList
              data={attendanceRecords}
              renderItem={renderAttendanceRecord}
              keyExtractor={(item) => item.id}
              style={styles.list}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No attendance records for today</Text>
              }
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'column',
    gap: 12,
  },
  branchSelector: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  daySelector: {
    flexDirection: 'column',
    gap: 8,
    width: '100%',
  },
  branchButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  dayButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  selectedBranch: {
    backgroundColor: '#6200ee',
  },
  selectedDay: {
    backgroundColor: '#6200ee',
  },
  branchButtonText: {
    color: '#000',
  },
  dayButtonText: {
    color: '#000',
  },
  selectedBranchText: {
    color: '#fff',
  },
  selectedDayText: {
    color: '#fff',
  },
  createDayButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  scanButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  recordCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timeText: {
    color: '#666',
    marginBottom: 4,
  },
  statusText: {
    fontWeight: 'bold',
  },
  presentText: {
    color: '#4caf50',
  },
  absentText: {
    color: '#f44336',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  disabledButtonText: {
    color: '#666666',
  },
});