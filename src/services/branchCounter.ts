import { db } from '../config/firebase';
import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';

export type Branch = 'wardha' | 'nagpur' | 'butibori' | 'akola';

interface BranchCounter {
  count: number;
}

const getBranchPrefix = (branch: Branch): string => {
  switch (branch) {
    case 'nagpur':
      return 'NGP1111111';
    case 'wardha':
      return 'WR1211111';
    case 'butibori':
      return 'BUT1311111';
    case 'akola':
      return 'AK1411111';
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

      // Format: NGP1111111, BUT1311111, WR1211111, AK4444444 + sequential number
      const branchPrefix = getBranchPrefix(branch);
      return `${branchPrefix.slice(0, -1)}${currentCount}`;
    });

    return newId;
  } catch (error) {
    console.error('Error generating student ID:', error);
    throw new Error('Failed to generate student ID');
  }
};