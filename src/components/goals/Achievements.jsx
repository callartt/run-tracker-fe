// src/components/goals/Achievements.jsx
import { FaTrophy, FaMedal, FaStar } from 'react-icons/fa';
import { useGoals, GoalTypes, GoalPeriods } from '../../context/GoalsContext';
import { useUser } from '../../context/UserContext';
import { formatDistance, formatDuration } from '../../utils/calculations';

const Achievements = () => {
  const { achievements } = useGoals();
  const { user } = useUser();
  
  if (!achievements.length) {
    return null;
  }
  
  const formatAchievementValue = (achievement) => {
    switch (achievement.type) {
      case GoalTypes.DISTANCE:
        return formatDistance(achievement.value, user.units);
      case GoalTypes.DURATION:
        return formatDuration(achievement.value);
      case GoalTypes.FREQUENCY:
        return `${achievement.value} runs`;
      default:
        return achievement.value.toString();
    }
  };
  
  const getAchievementIcon = (achievement) => {
    // Different icons based on period or type
    if (achievement.period === GoalPeriods.YEARLY) {
      return <FaTrophy className="text-yellow-500" />;
    } else if (achievement.period === GoalPeriods.MONTHLY) {
      return <FaMedal className="text-yellow-600" />;
    } else {
      return <FaStar className="text-yellow-400" />;
    }
  };
  
  const getAchievementTitle = (achievement) => {
    const typeText = achievement.type === GoalTypes.DISTANCE 
      ? 'Distance' 
      : achievement.type === GoalTypes.DURATION 
        ? 'Time' 
        : 'Frequency';
        
    const periodText = achievement.period === GoalPeriods.WEEKLY 
      ? 'Weekly' 
      : achievement.period === GoalPeriods.MONTHLY 
        ? 'Monthly' 
        : 'Yearly';
        
    return `${periodText} ${typeText} Goal`;
  };
  
  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-4 flex items-center">
        <FaTrophy className="text-yellow-500 mr-2" />
        Your Achievements
      </h2>
      
      <div className="grid grid-cols-2 gap-3">
        {achievements.slice(0, 4).map(achievement => (
          <div key={achievement.id} className="card p-3 border border-yellow-200 dark:border-yellow-900">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mr-2">
                {getAchievementIcon(achievement)}
              </div>
              <div>
                <h3 className="text-sm font-medium">
                  {getAchievementTitle(achievement)}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(achievement.achievedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <p className="text-sm font-bold">
              {formatAchievementValue(achievement)}
            </p>
          </div>
        ))}
      </div>
      
      {achievements.length > 4 && (
        <p className="text-center text-sm text-primary mt-2">
          + {achievements.length - 4} more achievements
        </p>
      )}
    </div>
  );
};

export default Achievements;