import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Target,
  Users,
  Briefcase,
  BarChart3,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Progress } from './ui/Progress';
import { cn } from '../lib/utils';

const QualityScoreCard = ({
  score,
  sectionScores = {},
  feedback = {},
  thresholds = {},
  loading = false,
  compact = false
}) => {
  // Score classification
  const getScoreClassification = (score) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle };
    if (score >= 75) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: TrendingUp };
    if (score >= 60) return { label: 'Acceptable', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Info };
    if (score >= 45) return { label: 'Poor', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: AlertTriangle };
    return { label: 'Failing', color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle };
  };

  const classification = getScoreClassification(score?.overall_score || 0);
  const StatusIcon = classification.icon;

  // Section icons and colors
  const sectionConfig = {
    relevance: {
      icon: Target,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      label: 'Relevance',
      max: 30
    },
    partnership: {
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      label: 'Partnership',
      max: 20
    },
    impact: {
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      label: 'Impact',
      max: 25
    },
    project_management: {
      icon: Briefcase,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      label: 'Management',
      max: 25
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!score) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>Quality score not yet calculated</p>
        </CardContent>
      </Card>
    );
  }

  const overallScore = score.overall_score || 0;
  const sections = score.section_scores || sectionScores;
  const thresholdsMet = score.thresholds_met || thresholds;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-4 p-4 rounded-lg",
        classification.bgColor
      )}>
        <div className="relative">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${(overallScore / 100) * 176} 176`}
              className={classification.color}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-lg font-bold", classification.color)}>
              {Math.round(overallScore)}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon className={cn("h-5 w-5", classification.color)} />
            <span className={cn("font-semibold", classification.color)}>
              {classification.label}
            </span>
          </div>
          {thresholdsMet.all_thresholds_met ? (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Meets all thresholds
            </p>
          ) : (
            <p className="text-sm text-orange-600 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Below thresholds
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Quality Score Analysis</span>
          <div className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            classification.bgColor,
            classification.color
          )}>
            {classification.label}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score Circle */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(overallScore / 100) * 352} 352`}
                className={classification.color}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-3xl font-bold", classification.color)}>
                {Math.round(overallScore)}
              </span>
              <span className="text-sm text-gray-500">out of 100</span>
            </div>
          </div>
        </div>

        {/* Section Scores */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Section Breakdown
          </h3>
          {Object.entries(sectionConfig).map(([key, config]) => {
            const SectionIcon = config.icon;
            const sectionScore = sections[key] || 0;
            const percentage = (sectionScore / config.max) * 100;

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded", config.bgColor)}>
                      <SectionIcon className="h-4 w-4 text-gray-700" />
                    </div>
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {sectionScore.toFixed(1)}/{config.max}
                  </span>
                </div>
                <div className="relative">
                  <Progress value={percentage} className="h-2" />
                  {percentage < 50 && (
                    <ArrowDown className="absolute -right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                  {percentage > 80 && (
                    <ArrowUp className="absolute -right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Threshold Status */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Threshold Requirements
          </h3>
          <div className="space-y-2">
            <ThresholdIndicator
              label="Minimum Total Score (60)"
              met={thresholdsMet.total}
              critical
            />
            <ThresholdIndicator
              label="Relevance Minimum (15)"
              met={thresholdsMet.relevance}
            />
            <ThresholdIndicator
              label="Quality Minimum (15)"
              met={thresholdsMet.quality}
            />
            <ThresholdIndicator
              label="Impact Minimum (15)"
              met={thresholdsMet.impact}
            />
          </div>
        </div>

        {/* Feedback Section */}
        {feedback && (
          <>
            {/* Quick Wins */}
            {feedback.quick_wins && feedback.quick_wins.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Quick Improvements
                </h3>
                <div className="space-y-2">
                  {feedback.quick_wins.slice(0, 3).map((win, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <div className="p-1 rounded bg-blue-100 mt-0.5">
                        <ArrowUp className="h-3 w-3 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700">{win.suggestion}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Potential: +{win.potential_score_increase} points
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Critical Warnings */}
            {feedback.threshold_warnings && feedback.threshold_warnings.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Warnings
                </h3>
                <div className="space-y-2">
                  {feedback.threshold_warnings.map((warning, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">{warning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

const ThresholdIndicator = ({ label, met, critical = false }) => {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
      <span className={cn(
        "text-sm",
        critical ? "font-medium" : ""
      )}>
        {label}
      </span>
      {met ? (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Met</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-600">
          <XCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Not Met</span>
        </div>
      )}
    </div>
  );
};

export default QualityScoreCard;