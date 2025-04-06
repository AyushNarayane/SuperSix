import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';

type Question = {
  questionText: string;
  options: string[];
  correctOption: number;
};

interface Props {
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
}

export const QuizEditor = ({ questions, onQuestionsChange }: Props) => {
  const addQuestion = () => {
    const newQuestions = [...questions, {
      questionText: '',
      options: ['', ''],
      correctOption: 0
    }];
    onQuestionsChange(newQuestions);
  };

  const updateQuestion = (index: number, field: string, value: string | number) => {
    const newQuestions = [...questions];
    if (typeof value === 'string') {
      newQuestions[index] = { ...newQuestions[index], [field]: value };
    } else {
      newQuestions[index].correctOption = value;
    }
    onQuestionsChange(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push('');
    onQuestionsChange(newQuestions);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.splice(oIndex, 1);
    if (newQuestions[qIndex].correctOption >= oIndex) {
      newQuestions[qIndex].correctOption = Math.max(0, newQuestions[qIndex].correctOption - 1);
    }
    onQuestionsChange(newQuestions);
  };

  return (
    <View style={styles.container}>
      {questions.map((question, qIndex) => (
        <View key={qIndex} style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionNumber}>Question {qIndex + 1}</Text>
            <TouchableOpacity onPress={() => {
              const newQuestions = questions.filter((_, i) => i !== qIndex);
              onQuestionsChange(newQuestions);
            }}>
              <Text style={styles.iconText}>×</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Enter question text"
            value={question.questionText}
            onChangeText={(text) => updateQuestion(qIndex, 'questionText', text)}
          />

          {question.options.map((option, oIndex) => (
            <View key={oIndex} style={styles.optionRow}>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => updateQuestion(qIndex, 'correctOption', oIndex)}
              >
                <Text style={[styles.iconText, question.correctOption === oIndex ? styles.selectedRadio : styles.unselectedRadio]}>
                  {question.correctOption === oIndex ? '●' : '○'}
                </Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.optionInput]}
                placeholder={`Option ${oIndex + 1}`}
                value={option}
                onChangeText={(text) => {
                  const newOptions = [...question.options];
                  newOptions[oIndex] = text;
                  const newQuestions = [...questions];
                  newQuestions[qIndex] = {...newQuestions[qIndex], options: newOptions};
                  onQuestionsChange(newQuestions);
                }}
              />
              {question.options.length > 2 && (
                <TouchableOpacity onPress={() => removeOption(qIndex, oIndex)}>
                  <Text style={styles.iconText}>−</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={styles.addOptionButton}
            onPress={() => addOption(qIndex)}
          >
            <Text style={styles.addOptionText}>Add Option</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addQuestionButton} onPress={addQuestion}>
        <Text style={styles.addQuestionText}>Add Question</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6200ee',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  radioButton: {
    marginRight: 10,
  },
  optionInput: {
    flex: 1,
    marginRight: 10,
  },
  addOptionButton: {
    backgroundColor: '#f3e5f5',
    padding: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  addOptionText: {
    color: '#6200ee',
  },
  addQuestionButton: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addQuestionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  iconText: {
    fontSize: 24,
    color: '#6200ee',
  },
  selectedRadio: {
    color: '#6200ee',
  },
  unselectedRadio: {
    color: '#757575',
  },
});