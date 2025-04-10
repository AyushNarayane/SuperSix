import { db } from '../config/firebase';
import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';

export type Branch = 'wardha' | 'nagpur' | 'butibori' | 'akola';

interface BranchCounter {
  count: number;
}

const getBranchCode = (branch: Branch): string => {
  switch (branch) {
    case 'nagpur':
      return 'NG';
    case 'wardha':
      return 'WR';
    case 'butibori':
      return 'BR';
    case 'akola':
      return 'AK';
    default:
      throw new Error('Invalid branch');
  }
};

export const generateStudentId = async (branch: Branch): Promise<string> => {
  const branchCounterRef = doc(db, 'branchCounters', branch);

  try {
    // Use transaction to ensure atomic operation
    const newId = await runTransaction(db, async (transaction) => {
      const branchCounterDoc = await transaction.get(branchCounterRef);
      let currentCount = 1;

      if (branchCounterDoc.exists()) {
        currentCount = (branchCounterDoc.data() as BranchCounter).count + 1;
      }

      transaction.set(branchCounterRef, { count: currentCount });

      // Format: BR0001, NG0001, WR0001
      const branchCode = getBranchCode(branch);
      return `${branchCode}${currentCount.toString().padStart(4, '0')}`;
    });

    return newId;
  } catch (error) {
    console.error('Error generating student ID:', error);
    throw new Error('Failed to generate student ID');
  }
};