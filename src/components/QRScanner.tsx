import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

interface QRScannerProps {
  onClose: () => void;
  onScanSuccess: (studentId: string) => void;
  branchId: string;
  dayId: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onClose, onScanSuccess, branchId, dayId }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    try {
      setScanned(true);
      
      // Assuming the QR code contains the student ID
      const studentId = data;
      
      // Check if student belongs to this branch
      const studentQuery = query(
        collection(db, 'users'),
        where('branch', '==', branchId)
      );
      
      const studentDocs = await getDocs(studentQuery);
      
      // Find the student document that matches the scanned QR code (which contains the student ID)
      const studentDoc = studentDocs.docs.find(doc => doc.data().uid === studentId);
      
      if (!studentDoc) {
        alert('Student does not belong to this branch');
        return;
      }
      
      // Add attendance record to Firestore
      await addDoc(collection(db, 'attendance'), {
        studentId,
        timestamp: Timestamp.now(),
        status: 'present',
        branchId,
        dayId
      });

      onScanSuccess(studentId);
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={styles.scanner}
      />
      {scanned && (
        <Button title="Scan Again" onPress={() => setScanned(false)} />
      )}
      <Button title="Close Scanner" onPress={onClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  scanner: {
    width: '100%',
    height: '80%',
  },
});