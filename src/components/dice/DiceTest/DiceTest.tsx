import React, { useState } from 'react';
import { testDiceDistribution, runMultipleTests, generateTestReport } from '../../../utils/diceTestingUtils';
import type { DiceRandomnessTestResult, MultipleTestResults } from '../../../utils/diceTestingUtils';
import { rollDie } from '../../../utils/diceUtils';
import './DiceTest.css';

interface DiceTestProps {
  defaultSampleSize?: number;
}

export const DiceTest: React.FC<DiceTestProps> = ({ defaultSampleSize = 10000 }) => {
  const [sampleSize, setSampleSize] = useState(defaultSampleSize);
  const [runCount, setRunCount] = useState(10);
  const [testResult, setTestResult] = useState<DiceRandomnessTestResult | null>(null);
  const [multipleTestResult, setMultipleTestResult] = useState<MultipleTestResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'multiple'>('single');

  const handleSingleTest = () => {
    setIsLoading(true);
    // Use setTimeout to avoid blocking the UI
    setTimeout(() => {
      const result = testDiceDistribution(rollDie, sampleSize);
      setTestResult(result);
      setIsLoading(false);
    }, 0);
  };

  const handleMultipleTests = () => {
    setIsLoading(true);
    // Use setTimeout to avoid blocking the UI
    setTimeout(() => {
      const result = runMultipleTests(rollDie, sampleSize, runCount);
      setMultipleTestResult(result);
      setIsLoading(false);
    }, 0);
  };

  const renderDistributionChart = (result: DiceRandomnessTestResult) => {
    const maxCount = Math.max(...Object.values(result.counts));
    
    return (
      <div className="dice-test__chart">
        {Array.from({ length: 6 }, (_, i) => i + 1).map(face => {
          const count = result.counts[face];
          const percentage = result.percentages[face];
          const height = (count / maxCount) * 100;
          const barColor = Math.abs(result.deviations[face]) > 5 
            ? 'dice-test__bar--warning' 
            : 'dice-test__bar--normal';
          
          return (
            <div key={face} className="dice-test__bar-container">
              <div className="dice-test__label">{face}</div>
              <div 
                className={`dice-test__bar ${barColor}`} 
                style={{ height: `${height}%` }} 
                title={`Face ${face}: ${count} rolls (${percentage.toFixed(2)}%)`}
              />
              <div className="dice-test__value">{percentage.toFixed(1)}%</div>
            </div>
          );
        })}
        <div className="dice-test__baseline">
          <div className="dice-test__baseline-label">Expected: 16.67%</div>
        </div>
      </div>
    );
  };

  const renderMultipleTestsSummary = () => {
    if (!multipleTestResult) return null;
    
    return (
      <div className="dice-test__multiple-summary">
        <h3>Multiple Tests Summary</h3>
        <p>
          <strong>Tests run:</strong> {runCount}<br />
          <strong>Sample size per test:</strong> {sampleSize}<br />
          <strong>Tests passed:</strong> {Math.round(multipleTestResult.passRate * runCount / 100)} ({multipleTestResult.passRate.toFixed(1)}%)<br />
          <strong>Tests failed:</strong> {runCount - Math.round(multipleTestResult.passRate * runCount / 100)} ({(100 - multipleTestResult.passRate).toFixed(1)}%)<br />
          <strong>Avg Chi-Square:</strong> {multipleTestResult.avgChiSquare.toFixed(4)}<br />
          <strong>Overall Assessment:</strong>{' '}
          <span className={multipleTestResult.overallRandom ? 'dice-test__success' : 'dice-test__error'}>
            {multipleTestResult.overallRandom ? 'LIKELY RANDOM' : 'POTENTIALLY BIASED'}
          </span>
        </p>

        <h4>Detailed Results:</h4>
        <div className="dice-test__multiple-details">
          {multipleTestResult.results?.map((result, index) => (
            <div key={index} className="dice-test__result-item">
              <strong>Test #{index + 1}:</strong> Chi-Square: {result.chiSquare.toFixed(4)} - 
              <span className={result.passed ? 'dice-test__success' : 'dice-test__error'}>
                {result.passed ? ' PASS' : ' FAIL'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="dice-test">
      <h2>Dice Randomness Test</h2>
      
      <div className="dice-test__tabs">
        <button 
          className={`dice-test__tab ${activeTab === 'single' ? 'dice-test__tab--active' : ''}`} 
          onClick={() => setActiveTab('single')}
        >
          Single Test
        </button>
        <button 
          className={`dice-test__tab ${activeTab === 'multiple' ? 'dice-test__tab--active' : ''}`}
          onClick={() => setActiveTab('multiple')}
        >
          Multiple Tests
        </button>
      </div>

      {activeTab === 'single' ? (
        <div className="dice-test__panel">
          <div className="dice-test__controls">
            <div>
              <label htmlFor="sampleSize">Sample Size:</label>
              <input 
                type="number" 
                id="sampleSize" 
                value={sampleSize} 
                onChange={(e) => setSampleSize(Number(e.target.value))} 
                min="1000" 
                step="1000"
              />
            </div>
            
            <button 
              className="dice-test__button" 
              onClick={handleSingleTest} 
              disabled={isLoading}
            >
              {isLoading ? 'Running Test...' : 'Run Single Test'}
            </button>
          </div>

          {testResult && (
            <div className="dice-test__results">
              <h3>Test Results</h3>
              
              {renderDistributionChart(testResult)}
              
              <div className="dice-test__stats">
                <h4>Statistical Analysis:</h4>
                <p>
                  <strong>Chi-Square Value:</strong> {testResult.chiSquareValue.toFixed(4)}<br />
                  <strong>P-Value:</strong> {testResult.pValue.toFixed(4)}<br />
                  <strong>Distribution Assessment:</strong>{' '}
                  <span className={testResult.isProbablyRandom ? 'dice-test__success' : 'dice-test__error'}>
                    {testResult.isProbablyRandom ? 'LIKELY RANDOM' : 'POTENTIALLY BIASED'}
                  </span>
                </p>
              </div>
              
              <div className="dice-test__explanation">
                <h4>What This Means:</h4>
                <p>
                  For a fair six-sided die, we expect each face to appear about {(100/6).toFixed(2)}% of the time.
                  The chi-square test measures how much the observed distribution differs from the expected distribution.
                </p>
                <p>
                  A chi-square value less than 11.07 (with 5 degrees of freedom) suggests the distribution is random 
                  with 95% confidence. Higher values indicate potential bias.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="dice-test__panel">
          <div className="dice-test__controls">
            <div>
              <label htmlFor="multiSampleSize">Sample Size Per Test:</label>
              <input 
                type="number" 
                id="multiSampleSize" 
                value={sampleSize} 
                onChange={(e) => setSampleSize(Number(e.target.value))} 
                min="1000" 
                step="1000"
              />
            </div>
            <div>
              <label htmlFor="runCount">Number of Test Runs:</label>
              <input 
                type="number" 
                id="runCount" 
                value={runCount} 
                onChange={(e) => setRunCount(Number(e.target.value))} 
                min="5" 
                max="100"
              />
            </div>
            
            <button 
              className="dice-test__button" 
              onClick={handleMultipleTests} 
              disabled={isLoading}
            >
              {isLoading ? 'Running Tests...' : 'Run Multiple Tests'}
            </button>
          </div>

          {multipleTestResult && renderMultipleTestsSummary()}
        </div>
      )}
    </div>
  );
}; 