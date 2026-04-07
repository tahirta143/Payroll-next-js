'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const PayrollInsights = ({ payrollData }) => {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customData, setCustomData] = useState('');

  const generateInsights = async (data) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/ai/insights',
        { payrollData: data },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setInsights(response.data.insights);
      } else {
        throw new Error(response.data.message || 'Failed to generate insights');
      }
    } catch (error) {
      console.error('Insights Error:', error);
      setInsights('Failed to generate insights. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomDataSubmit = (e) => {
    e.preventDefault();
    if (!customData.trim()) return;

    try {
      const data = JSON.parse(customData);
      generateInsights(data);
    } catch (error) {
      alert('Invalid JSON format. Please check your data.');
    }
  };

  const formatInsights = (insightsText) => {
    if (!insightsText) return null;

    const sections = insightsText.split(/\d+\./).filter(Boolean);
    
    return sections.map((section, index) => {
      const lines = section.trim().split('\n').filter(Boolean);
      if (lines.length === 0) return null;

      const title = lines[0]?.trim();
      const content = lines.slice(1).join('\n');

      const getIcon = (title) => {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('trend') || lowerTitle.includes('pattern')) {
          return <TrendingUp className="h-5 w-5 text-green-500" />;
        } else if (lowerTitle.includes('issue') || lowerTitle.includes('concern')) {
          return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        } else if (lowerTitle.includes('recommendation') || lowerTitle.includes('optimization')) {
          return <CheckCircle className="h-5 w-5 text-blue-500" />;
        }
        return <Brain className="h-5 w-5 text-purple-500" />;
      };

      return (
        <div key={index} className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            {getIcon(title)}
            <h4 className="font-semibold">{title}</h4>
          </div>
          {content && (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {content}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Payroll Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!payrollData && (
          <form onSubmit={handleCustomDataSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Enter Payroll Data (JSON format)
              </label>
              <Textarea
                value={customData}
                onChange={(e) => setCustomData(e.target.value)}
                placeholder={`Example:
{
  "employees": [
    {"id": 1, "name": "John", "salary": 50000, "department": "IT"},
    {"id": 2, "name": "Jane", "salary": 60000, "department": "HR"}
  ],
  "period": "2024-01",
  "totalPayroll": 110000
}`}
                className="min-h-[120px] font-mono text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={!customData.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Insights...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Insights
                </>
              )}
            </Button>
          </form>
        )}

        {payrollData && (
          <Button
            onClick={() => generateInsights(payrollData)}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Insights...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate Insights from Current Data
              </>
            )}
          </Button>
        )}

        {insights && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">AI Analysis</h3>
            <div className="space-y-3">
              {formatInsights(insights)}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Analyzing payroll data...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PayrollInsights;
