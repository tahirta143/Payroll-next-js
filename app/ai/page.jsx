'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AIChat from '@/components/AIChat';
import PayrollInsights from '@/components/PayrollInsights';
import { Brain, MessageSquare, TrendingUp } from 'lucide-react';

const AIPage = () => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <DashboardLayout
      pageTitle="AI Assistant"
      pageSubtitle="Get help with payroll, HR, and insights"
    >
      <div className="space-y-6 pt-2">
        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-muted/30 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            AI Chat
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'insights'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Payroll Insights
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeTab === 'chat' && (
            <>
              <div className="lg:col-span-2">
                <AIChat />
              </div>
              <div className="lg:col-span-2">
                <div className="dashboard-card p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    What can I help you with?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        title: 'Payroll Calculations',
                        description: 'Salary, taxes, deductions, and net pay',
                        icon: '¢'
                      },
                      {
                        title: 'Tax Questions',
                        description: 'Income tax, withholdings, and compliance',
                        icon: '§'
                      },
                      {
                        title: 'Attendance Issues',
                        description: 'Leave policies, overtime, and time tracking',
                        icon: '·'
                      },
                      {
                        title: 'HR Policies',
                        description: 'Employee benefits, company policies',
                        icon: '¶'
                      },
                      {
                        title: 'Compliance',
                        description: 'Labor laws, regulations, requirements',
                        icon: '®'
                      },
                      {
                        title: 'Data Analysis',
                        description: 'Trends, patterns, payroll insights',
                        icon: '°'
                      }
                    ].map((item, index) => (
                      <div key={index} className="p-4 rounded-lg bg-muted/30 border border-border/10">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {item.icon}
                          </div>
                          <h4 className="font-medium text-sm">{item.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'insights' && (
            <>
              <div className="lg:col-span-2">
                <PayrollInsights />
              </div>
              <div className="lg:col-span-2">
                <div className="dashboard-card p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI-Powered Analysis
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Our AI analyzes your payroll data to provide actionable insights, identify trends, and highlight potential issues before they become problems.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/10">
                        <h4 className="font-medium text-sm mb-2">Trend Analysis</h4>
                        <p className="text-xs text-muted-foreground">
                          Identify patterns in attendance, overtime, and payroll costs over time.
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/10">
                        <h4 className="font-medium text-sm mb-2">Anomaly Detection</h4>
                        <p className="text-xs text-muted-foreground">
                          Spot unusual patterns that might indicate errors or fraud.
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/10">
                        <h4 className="font-medium text-sm mb-2">Optimization Tips</h4>
                        <p className="text-xs text-muted-foreground">
                          Get recommendations for cost savings and process improvements.
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/10">
                        <h4 className="font-medium text-sm mb-2">Compliance Check</h4>
                        <p className="text-xs text-muted-foreground">
                          Ensure your payroll practices meet regulatory requirements.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIPage;
