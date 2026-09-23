class Solution{
  

    public static boolean fn(int[] a, int index, int sum, Boolean[][] dp) {

        if (sum == 0) {
            return true;
        }

        if (index >= a.length) {
            return false;
        }

        if (dp[index][sum] != null) {
            return dp[index][sum];
        }

        boolean take = false;

        if (a[index] <= sum) {
            take = fn(a, index + 1, sum - a[index], dp);
        }

        boolean skip = fn(a, index + 1, sum, dp);

        return dp[index][sum] = take || skip;
    }

    public static void main(String[] args) {

        int[] a = {1, 3, 5, 6, 3};
        int target = 11;

        Boolean[][] dp = new Boolean[a.length][target + 1];

        System.out.println(fn(a, 0, target, dp));
    }
}